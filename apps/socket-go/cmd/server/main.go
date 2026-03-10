package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/socket-go/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/socket-go/internal/cache"
	"github.com/arpansaha13/messaging-system/apps/socket-go/internal/config"
	"github.com/arpansaha13/messaging-system/apps/socket-go/internal/constants"
	"github.com/arpansaha13/messaging-system/apps/socket-go/internal/store"
	"github.com/arpansaha13/messaging-system/apps/socket-go/internal/ws"
)

const (
	pingFlushInterval = 5 * time.Second
	onlineStatusTTL   = int32(60)
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(fmt.Sprintf("failed to load config: %v", err))
	}

	zapLogger, err := logger.InitLogger(parseLogLevel(cfg.LogLevel))
	if err != nil {
		panic(fmt.Sprintf("failed to initialize logger: %v", err))
	}
	zap.ReplaceGlobals(zapLogger)
	defer zapLogger.Sync()

	log := zap.L()
	rootCtx := logger.WithContext(context.Background(), zapLogger)

	// In-memory state
	chatsStore := store.NewChatsStore()

	// Memcached
	memcachedAddr := fmt.Sprintf("%s:%s", cfg.MemcachedHost, cfg.MemcachedPort)
	memcachedSvc, err := cache.NewMemcachedService(rootCtx, memcachedAddr)
	if err != nil {
		log.Fatal("failed to connect to memcached", zap.Error(err))
	}

	// RabbitMQ
	amqpURL := fmt.Sprintf("amqp://%s:%s@%s:%d/", cfg.RabbitMQUser, cfg.RabbitMQPass, cfg.RabbitMQHost, cfg.RabbitMQPort)
	rabbitBroker := broker.NewRabbitMQBroker(amqpURL, cfg.ServerId, log)
	if err := rabbitBroker.Connect(rootCtx); err != nil {
		log.Fatal("failed to connect to RabbitMQ", zap.Error(err))
	}
	defer rabbitBroker.Disconnect()

	// WebSocket hub and handlers
	hub := ws.NewHub(log)
	personalHandlers := ws.NewPersonalHandlers(chatsStore, memcachedSvc, rabbitBroker, hub, log)
	groupHandlers := ws.NewGroupHandlers(chatsStore, hub, log)

	upgrader := ws.NewUpgrader(cfg.ClientDomain)
	dispatch := ws.BuildDispatcher(personalHandlers, groupHandlers, log)

	// HTTP mux — path /socket.io keeps nginx routing unchanged
	mux := http.NewServeMux()
	mux.HandleFunc("/socket", func(w http.ResponseWriter, r *http.Request) {
		log.Debug("WebSocket connection request", zap.String("remote_addr", r.RemoteAddr))
		ws.ServeWs(hub, chatsStore, dispatch,
			personalHandlers.HandleConnect,
			personalHandlers.HandleDisconnect,
			upgrader, log, w, r,
		)
	})

	// Server-queue consumer: route messages to the correct socket or room.
	if err := rabbitBroker.ConsumeFromServerQueue(func(msg *broker.ServerQueueMessage, ack func()) {
		defer ack()
		switch {
		case msg.UserId != nil:
			socketId, ok := chatsStore.GetClient(*msg.UserId)
			if ok {
				if err := hub.EmitToSocket(socketId, msg.Event, msg.Data); err != nil {
					log.Error("emit to socket failed", zap.Error(err))
				}
			}
		case msg.ChannelId != nil:
			if err := hub.EmitToRoom(strconv.FormatInt(*msg.ChannelId, 10), msg.Event, msg.Data); err != nil {
				log.Error("emit to channel room failed", zap.Error(err))
			}
		case msg.GroupId != nil:
			// For group:new-channel, also join sockets to the new channel room.
			if msg.Event == constants.GroupNewChannel && msg.ChannelId != nil {
				groupHandlers.HandleNewChannelFromBroker(*msg.GroupId, *msg.ChannelId)
			} else {
				if err := hub.EmitToRoom(fmt.Sprintf("group-%d", *msg.GroupId), msg.Event, msg.Data); err != nil {
					log.Error("emit to group room failed", zap.Error(err))
				}
			}
		}
	}); err != nil {
		log.Fatal("failed to start server queue consumer", zap.Error(err))
	}

	// Subscription-queue consumer: bind channels/groups and join rooms for a user.
	if err := rabbitBroker.ConsumeFromSubscriptionQueue(func(msg *broker.SubscriptionMessage, ack func()) {
		defer ack()

		socketId, ok := chatsStore.GetClient(msg.UserId)
		if !ok {
			return
		}

		for _, channelId := range msg.ChannelIds {
			if err := rabbitBroker.BindChannelToQueue(channelId); err != nil {
				log.Error("failed to bind channel", zap.Int64("channel_id", channelId), zap.Error(err))
			}
		}
		for _, groupId := range msg.GroupIds {
			if err := rabbitBroker.BindGroupToQueue(groupId); err != nil {
				log.Error("failed to bind group", zap.Int64("group_id", groupId), zap.Error(err))
			}
		}

		channelRooms := make([]string, len(msg.ChannelIds))
		for i, id := range msg.ChannelIds {
			channelRooms[i] = strconv.FormatInt(id, 10)
		}
		hub.RoomsJoin(socketId, channelRooms)

		chatsStore.AddUserChannels(msg.UserId, msg.ChannelIds)
		chatsStore.AddUserGroups(msg.UserId, msg.GroupIds)

		for _, groupId := range msg.GroupIds {
			chatsStore.AddSocketToGroup(groupId, socketId)
			hub.JoinRoom(socketId, fmt.Sprintf("group-%d", groupId))
		}

		log.Info("subscribed user to channels and groups",
			zap.Int64("user_id", msg.UserId),
			zap.Int64s("channels", msg.ChannelIds),
			zap.Int64s("groups", msg.GroupIds),
		)
	}); err != nil {
		log.Fatal("failed to start subscription queue consumer", zap.Error(err))
	}

	// Ping flush ticker: periodically flush online-status pings to Memcached.
	ticker := time.NewTicker(pingFlushInterval)
	defer ticker.Stop()
	go func() {
		for range ticker.C {
			userIds := chatsStore.GetAndClearPingTrackingSet()
			if len(userIds) > 0 {
				if err := memcachedSvc.SetBatchOnline(userIds, onlineStatusTTL); err != nil {
					log.Error("error flushing ping tracking to memcached", zap.Error(err))
				}
			}
		}
	}()

	// Start HTTP server
	httpServer := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Port),
		Handler: mux,
	}
	go func() {
		log.Info("WebSocket server listening", zap.String("addr", httpServer.Addr))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("server error", zap.Error(err))
		}
	}()

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGTERM, syscall.SIGINT)
	<-sigChan

	log.Info("shutdown signal received, stopping gracefully")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Error("HTTP server shutdown error", zap.Error(err))
	}
}

func parseLogLevel(s string) zapcore.Level {
	var level zapcore.Level
	if err := level.UnmarshalText([]byte(s)); err != nil {
		return zapcore.InfoLevel
	}
	return level
}

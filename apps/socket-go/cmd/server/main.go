package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/socket-go/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/socket-go/internal/config"
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

	// Setup Memcached for online status tracking
	memcachedSvc, err := setupMemcached(rootCtx, log, cfg.MemcachedHost, cfg.MemcachedPort)
	if err != nil {
		log.Fatal("failed to setup memcached", zap.Error(err))
	}

	// Initialize WebSocket hub first (needed for ConnectionManager callbacks)
	hub := ws.NewHub(log)

	amqpURL := fmt.Sprintf("amqp://%s:%s@%s:%d/", cfg.RabbitMQUser, cfg.RabbitMQPass, cfg.RabbitMQHost, cfg.RabbitMQPort)
	rabbitBroker := broker.NewRabbitMQBroker(amqpURL, cfg.ServerId, log)

	// WebSocket handlers (needed for setupRabbitMQ function)
	personalHandlers := ws.NewPersonalHandlers(chatsStore, memcachedSvc, rabbitBroker, hub, log)
	groupHandlers := ws.NewGroupHandlers(chatsStore, hub, log)

	// Setup RabbitMQ connection manager with auto-reconnect
	rabbitMQConnMgr, err := setupRabbitMQ(rootCtx, log, rabbitBroker, hub, chatsStore, groupHandlers)
	if err != nil {
		log.Fatal("failed to setup rabbitmq", zap.Error(err))
	}

	upgrader := ws.NewUpgrader(cfg.ClientDomain)
	dispatch := ws.BuildDispatcher(personalHandlers, groupHandlers, log)

	// HTTP mux — path /socket keeps nginx routing unchanged
	mux := http.NewServeMux()
	mux.HandleFunc("/livez", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("/socket", func(w http.ResponseWriter, r *http.Request) {
		log.Debug("WebSocket connection request", zap.String("remote_addr", r.RemoteAddr))
		ws.ServeWs(hub, chatsStore, dispatch,
			personalHandlers.HandleConnect,
			personalHandlers.HandleDisconnect,
			upgrader, log, w, r,
		)
	})

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

	// Stop RabbitMQ connection manager
	if err := rabbitMQConnMgr.Stop(); err != nil {
		log.Error("error stopping rabbitmq connection manager", zap.Error(err))
	}

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

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
	"github.com/arpansaha13/messaging-system/apps/socket-go/internal/app"
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

	// Setup Memcached connection manager with auto-reconnect
	memcachedService, memcachedConnMgr, err := setupMemcached(rootCtx, cfg.Memcached, log)
	if err != nil {
		log.Fatal("failed to setup memcached", zap.Error(err))
	}

	// Initialize WebSocket hub
	hub := ws.NewHub(log)

	// GroupHandlers has no service deps — created before broker setup
	// because setupRabbitMQ needs it for subscription consumer callbacks.
	groupHandlers := ws.NewGroupHandlers(chatsStore, hub, log)

	// Setup RabbitMQ — creates RabbitMQBroker internally
	rabbitBroker, rabbitMQConnMgr, err := setupRabbitMQ(rootCtx, cfg.RabbitMQ, cfg.ServerId, log, hub, chatsStore, groupHandlers)
	if err != nil {
		log.Fatal("failed to setup rabbitmq", zap.Error(err))
	}

	// Assemble HTTP server — app.New creates PersonalHandlers from injected deps
	httpServer := app.New(app.Deps{
		Logger:        log,
		Hub:           hub,
		RabbitBroker:  rabbitBroker,
		ChatsStore:    chatsStore,
		MemcachedService: memcachedService,
		GroupHandlers: groupHandlers,
		ClientDomain:  cfg.ClientDomain,
		Port:          cfg.Port,
	})

	// Ping flush ticker: periodically flush online-status pings to Memcached.
	ticker := time.NewTicker(pingFlushInterval)
	defer ticker.Stop()
	go func() {
		for range ticker.C {
			userIds := chatsStore.GetAndClearPingTrackingSet()
			if len(userIds) > 0 {
				if err := memcachedService.SetBatchOnline(userIds, onlineStatusTTL); err != nil {
					log.Error("error flushing ping tracking to memcached", zap.Error(err))
				}
			}
		}
	}()

	// Start HTTP server
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

	if err := memcachedConnMgr.Stop(); err != nil {
		log.Error("error stopping memcached connection manager", zap.Error(err))
	}

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

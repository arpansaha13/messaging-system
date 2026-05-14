package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/app"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/config"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/store"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/ws"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
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

	zapLogger, err := gtk.NewZapLogger(parseLogLevel(cfg.LogLevel))
	if err != nil {
		panic(fmt.Sprintf("failed to initialize logger: %v", err))
	}
	zap.ReplaceGlobals(zapLogger)
	defer zapLogger.Sync()

	log := zap.L()
	rootCtx := gtk.LoggerWithContext(context.Background(), zapLogger)

	// Initialize circuit breakers
	cbs := circuits.New(log)

	authService, authConnMgr, err := app.SetupAuthService(rootCtx, cfg.AuthSystemHost, log, cbs)
	if err != nil {
		log.Fatal("failed to connect to auth service", zap.Error(err))
	}

	// In-memory state
	chatsStore := store.NewChatsStore()

	presenceCache, presenceCacheConnMgr, err := app.SetupPresenceCache(rootCtx, cfg.Memcached, log)
	if err != nil {
		log.Fatal("failed to setup presence cache", zap.Error(err))
	}

	// Initialize WebSocket hub
	hub := ws.NewHub(log)

	// GroupHandlers has no service deps — created before broker setup
	// because SetupChatBroker needs it for subscription consumer callbacks.
	groupHandlers := ws.NewGroupHandlers(chatsStore, hub, log)

	chatBroker, chatBrokerConnMgr, err := app.SetupChatBroker(rootCtx, cfg.RabbitMQ, cfg.ServerId, log, hub, chatsStore, groupHandlers)
	if err != nil {
		log.Fatal("failed to setup chat broker", zap.Error(err))
	}

	router := app.SetupRouter(app.Deps{
		Logger:           log,
		Hub:              hub,
		ChatBroker:       chatBroker,
		ChatsStore:       chatsStore,
		PresenceCache:    presenceCache,
		GroupHandlers:    groupHandlers,
		AuthClient:       authService,
		ClientDomain:     cfg.ClientDomain,
	})

	addr := fmt.Sprintf(":%d", cfg.Port)
	httpServer := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Ping flush ticker: periodically flush online-status pings to Memcached.
	ticker := time.NewTicker(pingFlushInterval)
	defer ticker.Stop()
	go func() {
		for range ticker.C {
			userIds := chatsStore.GetAndClearPingTrackingSet()
			if len(userIds) > 0 {
				if err := presenceCache.SetBatchOnline(userIds, onlineStatusTTL); err != nil {
					log.Error("error flushing ping tracking to presence cache", zap.Error(err))
				}
			}
		}
	}()

	// Start HTTP server
	go func() {
		log.Info("WebSocket server listening", zap.String("addr", addr))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("server error", zap.Error(err))
		}
	}()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGTERM, syscall.SIGINT)
	<-sigChan

	log.Info("shutdown signal received, stopping gracefully")

	// Graceful shutdown with timeout
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Error("HTTP server shutdown error", zap.Error(err))
	}

	if err := presenceCacheConnMgr.Stop(); err != nil {
		log.Error("error stopping presence cache connection manager", zap.Error(err))
	}

	if err := chatBrokerConnMgr.Stop(); err != nil {
		log.Error("error stopping chat broker connection manager", zap.Error(err))
	}

	if err := authConnMgr.Stop(); err != nil {
		log.Error("error stopping auth connection manager", zap.Error(err))
	}

	log.Info("server stopped")
}

func parseLogLevel(s string) zapcore.Level {
	var level zapcore.Level
	if err := level.UnmarshalText([]byte(s)); err != nil {
		return zapcore.InfoLevel
	}
	return level
}

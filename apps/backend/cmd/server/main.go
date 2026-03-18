package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/app"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/config"
)

const serviceName string = "backend"

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	zapLogger, err := logger.InitLogger(parseLogLevel(cfg.LogLevel))
	if err != nil {
		log.Fatalf("failed to initialize logger: %v", err)
	}
	defer zapLogger.Sync()
	zap.ReplaceGlobals(zapLogger)

	cbs := circuits.New(zapLogger)

	svcCtx := logger.WithContext(context.Background(), zapLogger)

	db, err := app.SetupPostgres(svcCtx, cfg.DatabaseURL, zapLogger)
	if err != nil {
		zapLogger.Fatal("failed to connect to postgres", zap.Error(err))
	}

	rabbitmqService, rabbitMQConnMgr, err := app.SetupRabbitMQ(svcCtx, cfg.RabbitMQ, zapLogger, cbs)
	if err != nil {
		zapLogger.Fatal("failed to setup rabbitmq", zap.Error(err))
	}

	authService, err := app.SetupAuthService(cfg.AuthSystemHost, cbs)
	if err != nil {
		log.Fatalf("failed to connect to auth service: %v", err)
	}

	router := app.SetupRouter(app.Deps{
		DB:         db,
		RabbitMQ:   rabbitmqService,
		AuthClient: authService,
		Circuits:   cbs,
		Logger:     zapLogger,
	})

	addr := fmt.Sprintf(":%d", cfg.APIPort)
	httpServer := &http.Server{
		Addr:         addr,
		Handler:      otelhttp.NewHandler(router, serviceName),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		zapLogger.Info("Server started", zap.String("address", addr))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			zapLogger.Fatal("server error", zap.Error(err))
		}
	}()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	zapLogger.Info("Shutting down server...")

	// Graceful shutdown with timeout
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		zapLogger.Error("server shutdown error", zap.Error(err))
	}

	// Close auth service connection
	if err := authService.Close(); err != nil {
		zap.L().Error("auth service close error", zap.Error(err))
	}

	// Close RabbitMQ connection manager
	if err := rabbitMQConnMgr.Stop(); err != nil {
		zap.L().Error("rabbitmq connection manager stop error", zap.Error(err))
	}

	// Close database connection
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.Close()
	}

	zapLogger.Info("Server stopped")
}

func parseLogLevel(s string) zapcore.Level {
	var level zapcore.Level
	if err := level.UnmarshalText([]byte(s)); err != nil {
		return zapcore.InfoLevel
	}
	return level
}

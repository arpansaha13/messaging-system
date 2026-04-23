package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(fmt.Sprintf("failed to load config: %v", err))
	}

	// Initialize logger
	zapLogger, err := gtk.NewZapLogger(parseLogLevel(cfg.LogLevel))
	if err != nil {
		panic(fmt.Sprintf("failed to initialize logger: %v", err))
	}
	zap.ReplaceGlobals(zapLogger)
	defer zapLogger.Sync()

	log := zap.L()

	// Initialize circuit breakers
	cbs := circuits.New(zapLogger)

	// Root context with logger injected
	rootCtx := gtk.LoggerWithContext(context.Background(), zapLogger)

	// Initialize database
	gormCfg := gorm.Config{
		Logger: gtk.NewGormLogger(zapLogger, gormlogger.Warn),
	}
	database, err := gtk.ConnectPostgresWithBackoff(rootCtx, cfg.DatabaseURL, &gormCfg)
	if err != nil {
		log.Fatal("failed to connect to postgres", zap.Error(err))
	}

	// Setup RabbitMQ connection manager with auto-reconnect
	rabbitMQConnMgr, err := setupRabbitMQ(rootCtx, cfg.RabbitMQ, log, database, cbs)
	if err != nil {
		log.Fatal("failed to setup rabbitmq", zap.Error(err))
	}

	log.Info("chat worker started and ready to process messages")

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGTERM, syscall.SIGINT)

	<-sigChan
	log.Info("SIGTERM received, shutting down gracefully")

	// Stop RabbitMQ connection manager
	if err := rabbitMQConnMgr.Stop(); err != nil {
		log.Error("error stopping rabbitmq connection manager", zap.Error(err))
	}

	// Close database
	sqlDB, err := database.DB()
	if err == nil {
		sqlDB.Close()
	}

	log.Info("chat worker stopped")
}

// parseLogLevel parses a string into zapcore.Level using zap's unmarshaling
func parseLogLevel(s string) zapcore.Level {
	var level zapcore.Level
	if err := level.UnmarshalText([]byte(s)); err != nil {
		return zapcore.InfoLevel
	}
	return level
}

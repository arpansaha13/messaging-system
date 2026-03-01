package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/config"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/controller"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/processor"
	commonbr "github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(fmt.Sprintf("failed to load config: %v", err))
	}

	// Initialize logger (uptrace otelzap wrapping stdout JSON output)
	zapLogger, err := logger.InitLogger(parseLogLevel(cfg.LogLevel))
	if err != nil {
		panic(fmt.Sprintf("failed to initialize logger: %v", err))
	}
	zap.ReplaceGlobals(zapLogger)
	defer zapLogger.Sync()

	log := zap.L()

	// Initialize circuit breakers
	cbs := circuits.New(zapLogger)

	// Root context with logger injected
	rootCtx := logger.WithContext(context.Background(), zapLogger)

	// Initialize database
	gormCfg := gorm.Config{
		Logger: gotoolkit.NewGormLogger(zapLogger, gormlogger.Warn),
	}
	database, err := gotoolkit.ConnectPostgresWithBackoff(rootCtx, cfg.DatabaseURL, &gormCfg)
	if err != nil {
		log.Fatal("failed to connect to postgres", zap.Error(err))
	}

	// Run migrations
	if err := database.AutoMigrate(
		&domain.UserProfile{},
		&domain.Message{},
		&domain.MessageRecipient{},
		&domain.Chat{},
		&domain.Channel{},
		&domain.Contact{},
		&domain.Group{},
		&domain.UserGroup{},
		&domain.Invite{},
	); err != nil {
		log.Fatal("failed to run migrations", zap.Error(err))
	}

	// Initialize RabbitMQ broker
	amqpURL := fmt.Sprintf("amqp://%s:%s@%s:%d/", cfg.RabbitMQUser, cfg.RabbitMQPass, cfg.RabbitMQHost, cfg.RabbitMQPort)
	messageBroker := broker.NewRabbitMQBroker(amqpURL, cbs.RabbitMQ)
	if err := messageBroker.Connect(rootCtx); err != nil {
		log.Fatal("failed to connect to RabbitMQ", zap.Error(err))
	}
	defer messageBroker.Disconnect()

	// Initialize processors
	messageProcessor := processor.NewMessageProcessor(database, messageBroker, cbs.Postgres)
	statusProcessor := processor.NewStatusProcessor(database, messageBroker, cbs.Postgres)
	connectionProcessor := processor.NewConnectionProcessor(database, messageBroker, cbs.Postgres)

	// Initialize event controller with dependency injection
	eventController := controller.NewEventController(messageProcessor, statusProcessor, connectionProcessor)

	// Setup worker queue consumer
	if err := messageBroker.ConsumeWorkerQueue(func(msg *commonbr.MessagePayload, ack func()) error {
		if err := eventController.HandleWorkerQueueEvent(rootCtx, msg); err != nil {
			log.Error("error handling worker queue event", zap.Error(err))
		}
		ack()
		return nil
	}); err != nil {
		log.Fatal("failed to setup worker queue consumer", zap.Error(err))
	}

	// Setup connection queue consumer
	if err := messageBroker.ConsumeConnectionQueue(func(msg *commonbr.UserConnectionPayload, ack func()) error {
		if err := eventController.HandleConnectionQueueEvent(rootCtx, msg); err != nil {
			log.Error("error handling connection queue event", zap.Error(err))
		}
		ack()
		return nil
	}); err != nil {
		log.Fatal("failed to setup connection queue consumer", zap.Error(err))
	}

	log.Info("chat worker started and ready to process messages")

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGTERM, syscall.SIGINT)

	<-sigChan
	log.Info("SIGTERM received, shutting down gracefully")

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

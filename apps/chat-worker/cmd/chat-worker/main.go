package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/config"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/controller"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/processor"
	commonbr "github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/db"
	"github.com/segmentio/kafka-go"
	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(fmt.Sprintf("failed to load config: %v", err))
	}

	// Initialize Kafka writer (owned by loggerProvider after this point — do not close separately)
	kafkaWriter := kafka.NewWriter(kafka.WriterConfig{
		Brokers:      []string{cfg.KafkaBrokers},
		Topic:        cfg.KafkaTopic,
		RequiredAcks: int(kafka.RequireAll),
	})

	// Create resource with service identity
	res, err := resource.New(context.Background(),
		resource.WithAttributes(semconv.ServiceName("chat-worker")),
	)
	if err != nil {
		panic(fmt.Sprintf("failed to create resource: %v", err))
	}

	// Initialize OTel logger provider with Kafka exporter
	loggerProvider, err := logger.NewKafkaLoggerProvider(kafkaWriter, res)
	if err != nil {
		panic(fmt.Sprintf("failed to initialize logger provider: %v", err))
	}

	// Initialize logger (uptrace otelzap wrapping stdout JSON output)
	otelLogger, err := logger.InitLogger(loggerProvider, parseLogLevel(cfg.LogLevel))
	if err != nil {
		panic(fmt.Sprintf("failed to initialize logger: %v", err))
	}
	otelLogger = otelLogger.WithOptions(zap.Fields(zap.String("service_name", "chat-worker")))
	otelzap.ReplaceGlobals(otelLogger)
	defer otelLogger.Sync()

	log := zap.L()

	// Root context with logger injected
	rootCtx := logger.WithContext(context.Background(), otelLogger)

	// Initialize database
	database, err := db.InitDB()
	if err != nil {
		log.Fatal("failed to initialize database", zap.Error(err))
	}

	// Initialize RabbitMQ broker
	amqpURL := fmt.Sprintf("amqp://%s:%s@%s:%d/", cfg.RabbitMQUser, cfg.RabbitMQPass, cfg.RabbitMQHost, cfg.RabbitMQPort)
	messageBroker := broker.NewRabbitMQBroker(amqpURL)
	if err := messageBroker.Connect(); err != nil {
		log.Fatal("failed to connect to RabbitMQ", zap.Error(err))
	}
	defer messageBroker.Disconnect()

	// Initialize processors
	messageProcessor := processor.NewMessageProcessor(database, messageBroker)
	statusProcessor := processor.NewStatusProcessor(database, messageBroker)
	connectionProcessor := processor.NewConnectionProcessor(database, messageBroker)

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

	// Flush and close the OTel log pipeline (drains BatchProcessor, closes Kafka writer)
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := loggerProvider.Shutdown(shutdownCtx); err != nil {
		log.Error("logger provider shutdown error", zap.Error(err))
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

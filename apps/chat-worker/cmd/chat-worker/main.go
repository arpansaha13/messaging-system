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
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(fmt.Sprintf("failed to load config: %v", err))
	}

	// Initialize logger
	logChan := make(chan []byte, cfg.KafkaLogChanSize)
	zapLogger, err := logger.InitLoggerWithChannel(logChan, parseLogLevel(cfg.LogLevel))
	if err != nil {
		panic(err)
	}
	zapLogger = zapLogger.With(zap.String("service_name", "chat-worker"))
	zap.ReplaceGlobals(zapLogger)
	defer zapLogger.Sync()

	log := zap.L()

	// Initialize Kafka writer
	kafkaWriter := kafka.NewWriter(kafka.WriterConfig{
		Brokers:      []string{cfg.KafkaBrokers},
		Topic:        cfg.KafkaTopic,
		RequiredAcks: int(kafka.RequireAll),
	})
	defer kafkaWriter.Close()

	// Start Kafka producer goroutine
	kafkaCtx, kafkaCancel := context.WithCancel(context.Background())
	go logger.KafkaLogProducer(kafkaCtx, logChan, kafkaWriter)

	// Root context with logger injected
	rootCtx := logger.WithContext(context.Background(), zapLogger)

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

	// Shutdown Kafka producer
	kafkaCancel()
	close(logChan)
	time.Sleep(1 * time.Second)

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

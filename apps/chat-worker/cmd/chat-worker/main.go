package main

import (
	"context"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/controller"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/processor"
	commonbr "github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/db"
	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func main() {
	// Initialize logger
	logChan := make(chan []byte, getLogChannelSize())
	zapLogger, err := logger.InitLoggerWithChannel(logChan, getLogLevel())
	if err != nil {
		panic(err)
	}
	zap.ReplaceGlobals(zapLogger)
	defer zapLogger.Sync()

	log := zap.L()

	// Initialize Kafka writer
	kafkaWriter := kafka.NewWriter(kafka.WriterConfig{
		Brokers:      []string{getKafkaBrokers()},
		Topic:        getKafkaTopic(),
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
	messageBroker := broker.NewRabbitMQBroker()
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

// getLogLevel reads LOG_LEVEL env var and returns zapcore.Level
func getLogLevel() zapcore.Level {
	level := os.Getenv("LOG_LEVEL")
	switch level {
	case "debug":
		return zapcore.DebugLevel
	case "info":
		return zapcore.InfoLevel
	case "warn":
		return zapcore.WarnLevel
	case "error":
		return zapcore.ErrorLevel
	default:
		return zapcore.InfoLevel
	}
}

// getLogChannelSize reads KAFKA_LOG_CHANNEL_SIZE env var and returns channel size
func getLogChannelSize() int {
	size := os.Getenv("KAFKA_LOG_CHANNEL_SIZE")
	if size == "" {
		return 1000
	}
	if parsed, err := strconv.Atoi(size); err == nil {
		return parsed
	}
	return 1000
}

// getKafkaBrokers reads KAFKA_BROKERS env var and returns broker address
func getKafkaBrokers() string {
	brokers := os.Getenv("KAFKA_BROKERS")
	if brokers == "" {
		return "kafka:9092"
	}
	return brokers
}

// getKafkaTopic reads KAFKA_TOPIC env var and returns topic name
func getKafkaTopic() string {
	topic := os.Getenv("KAFKA_TOPIC")
	if topic == "" {
		return "application-logs"
	}
	return topic
}

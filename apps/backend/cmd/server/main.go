package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/handler"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/utils"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// Initialize log channel for Kafka
	logChan := make(chan []byte, getLogChannelSize())

	// Initialize logger with channel writer
	zapLogger, err := logger.InitLoggerWithChannel(logChan, parseLogLevel(cfg.LogLevel))
	if err != nil {
		log.Fatalf("failed to initialize zap logger: %v", err)
	}
	zapLogger = zapLogger.With(zap.String("service_name", "backend"))
	defer zapLogger.Sync()
	zap.ReplaceGlobals(zapLogger)

	// Initialize Kafka writer
	kafkaWriter := kafka.NewWriter(kafka.WriterConfig{
		Brokers:      []string{getKafkaBrokers()},
		Topic:        getKafkaTopic(),
		RequiredAcks: int(kafka.RequireAll),
	})

	// Start Kafka producer goroutine
	kafkaCtx, kafkaCancel := context.WithCancel(context.Background())
	go logger.KafkaLogProducer(kafkaCtx, logChan, kafkaWriter)

	// Initialize database
	db, err := utils.InitDB(cfg.DatabaseURL)
	if err != nil {
		zapLogger.Fatal("failed to initialize database", zap.Error(err))
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	messageRepo := repository.NewMessageRepository(db)
	chatRepo := repository.NewChatRepository(db)
	channelRepo := repository.NewChannelRepository(db)
	contactRepo := repository.NewContactRepository(db)
	groupRepo := repository.NewGroupRepository(db)
	inviteRepo := repository.NewInviteRepository(db)
	userGroupRepo := repository.NewUserGroupRepository(db)
	messageRecipientRepo := repository.NewMessageRecipientRepository(db)

	// Initialize auth service client for gRPC communication
	authServiceHost := os.Getenv("AUTH_SYSTEM_HOST")
	if authServiceHost == "" {
		authServiceHost = "auth:50051" // Default host for Docker
	}

	authClient, err := service.NewAuthServiceClient(authServiceHost)
	if err != nil {
		log.Fatalf("failed to initialize auth service client: %v", err)
	}
	defer authClient.Close()

	// Initialize RabbitMQ service
	rabbitmqUser := os.Getenv("RABBITMQ_USER")
	rabbitmqPass := os.Getenv("RABBITMQ_PASS")
	rabbitmqURL := fmt.Sprintf("amqp://%s:%s@rabbitmq:5672/", rabbitmqUser, rabbitmqPass)

	rabbitmqService, err := service.NewRabbitMQService(rabbitmqURL)
	if err != nil {
		log.Printf("Warning: Failed to connect to RabbitMQ: %v - continuing without message publishing", err)
		rabbitmqService = nil
	}

	// Initialize services
	userService := service.NewUserService(userRepo, contactRepo)
	chatService := service.NewChatService(chatRepo, messageRepo)
	messageService := service.NewMessageService(messageRepo, messageRecipientRepo, chatRepo, rabbitmqService)
	channelService := service.NewChannelService(channelRepo, groupRepo)
	contactService := service.NewContactService(contactRepo, userRepo)
	groupService := service.NewGroupService(groupRepo, userGroupRepo, userRepo)
	inviteService := service.NewInviteService(inviteRepo, groupRepo, userGroupRepo, channelRepo)
	userGroupService := service.NewUserGroupService(userGroupRepo, userRepo, groupRepo)

	// Setup HTTP router
	router := mux.NewRouter()

	// Apply middlewares
	router.Use(middleware.RecoveryMiddleware)
	router.Use(logger.Middleware)
	router.Use(middleware.ErrorMiddleware)

	// Authentication middleware for protected routes
	protectedRouter := router.PathPrefix("").Subrouter()
	protectedRouter.Use(middleware.AuthMiddleware(authClient))

	// Setup routes
	handler.SetupAuthRoutes(router, authClient)
	handler.SetupAuthProtectedRoutes(protectedRouter, authClient)
	handler.SetupUserRoutes(router, protectedRouter, userService)
	handler.SetupMessageRoutes(router, protectedRouter, messageService)
	handler.SetupChatRoutes(router, protectedRouter, chatService)
	handler.SetupChannelRoutes(router, protectedRouter, channelService)
	handler.SetupContactRoutes(router, protectedRouter, contactService)
	handler.SetupGroupRoutes(router, protectedRouter, groupService)
	handler.SetupInviteRoutes(router, protectedRouter, inviteService)
	handler.SetupUserGroupRoutes(router, protectedRouter, userGroupService)

	// Create HTTP server
	addr := fmt.Sprintf(":%d", cfg.APIPort)
	httpServer := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
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
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		zapLogger.Error("server shutdown error", zap.Error(err))
	}

	// Cancel Kafka producer context
	kafkaCancel()

	// Close log channel to signal Kafka producer to stop
	close(logChan)

	// Wait a bit for Kafka producer to finish
	time.Sleep(1 * time.Second)

	// Close RabbitMQ connection
	if rabbitmqService != nil {
		if err := rabbitmqService.Close(); err != nil {
			zapLogger.Error("RabbitMQ close error", zap.Error(err))
		}
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

func getLogChannelSize() int {
	size := os.Getenv("KAFKA_LOG_CHANNEL_SIZE")
	if size == "" {
		return 1000 // Default size
	}
	val, err := strconv.Atoi(size)
	if err != nil {
		return 1000 // Default on parse error
	}
	return val
}

func getKafkaBrokers() string {
	brokers := os.Getenv("KAFKA_BROKERS")
	if brokers == "" {
		return "kafka:9092" // Default for Docker Compose
	}
	return brokers
}

func getKafkaTopic() string {
	topic := os.Getenv("KAFKA_TOPIC")
	if topic == "" {
		return "application-logs" // Default topic
	}
	return topic
}

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

	"github.com/gorilla/mux"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/handler"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

const serviceName string = "backend"

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// Initialize logger (uptrace otelzap wrapping stdout JSON output)
	zapLogger, err := logger.InitLogger(parseLogLevel(cfg.LogLevel))
	if err != nil {
		log.Fatalf("failed to initialize logger: %v", err)
	}
	defer zapLogger.Sync()
	zap.ReplaceGlobals(zapLogger)

	// Initialize database
	svcCtx := logger.WithContext(context.Background(), zapLogger)
	db, err := gotoolkit.ConnectPostgresWithBackoff(svcCtx, cfg.DatabaseURL)
	if err != nil {
		zapLogger.Fatal("failed to connect to postgres", zap.Error(err))
	}

	// Run migrations
	if err := db.AutoMigrate(
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
		zapLogger.Fatal("failed to run migrations", zap.Error(err))
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
	rabbitmqService, err := service.NewRabbitMQService(svcCtx, cfg.RabbitMQURL)
	if err != nil {
		zapLogger.Warn("Failed to connect to RabbitMQ - continuing without message publishing", zap.Error(err))
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
	router.Use(gotoolkit.HttpRecoveryMiddleware)
	router.Use(logger.HttpMiddleware(zapLogger))
	router.Use(gotoolkit.HttpErrorMiddleware)

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
	httpHandler := otelhttp.NewHandler(router, serviceName)
	httpServer := &http.Server{
		Addr:         addr,
		Handler:      httpHandler,
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
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		zapLogger.Error("server shutdown error", zap.Error(err))
	}

	// Close RabbitMQ connection
	if rabbitmqService != nil {
		if err := rabbitmqService.Close(); err != nil {
			zap.L().Error("RabbitMQ close error", zap.Error(err))
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

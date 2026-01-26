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

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/handler"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/utils"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// Initialize database
	db, err := utils.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to initialize database: %v", err)
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
	inviteService := service.NewInviteService(inviteRepo, groupRepo, userRepo)
	userGroupService := service.NewUserGroupService(userGroupRepo, userRepo, groupRepo)

	// Setup HTTP router
	router := mux.NewRouter()

	// Apply middlewares
	router.Use(middleware.LoggingMiddleware)
	router.Use(middleware.ErrorMiddleware)

	// Authentication middleware for protected routes
	protectedRouter := router.PathPrefix("").Subrouter()
	protectedRouter.Use(middleware.AuthMiddleware(authClient))

	// Setup routes
	handler.SetupAuthRoutes(router, authClient)
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
		log.Printf("Server started on %s", addr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		log.Printf("server shutdown error: %v", err)
	}

	// Close RabbitMQ connection
	if rabbitmqService != nil {
		if err := rabbitmqService.Close(); err != nil {
			log.Printf("RabbitMQ close error: %v", err)
		}
	}

	// Close database connection
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.Close()
	}

	log.Println("Server stopped")
}

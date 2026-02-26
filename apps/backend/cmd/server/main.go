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
	"github.com/segmentio/kafka-go"
	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	tracermw "github.com/arpansaha13/gotoolkit/tracer"
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

	// Initialize Kafka writer (owned by loggerProvider after this point — do not close separately)
	// Note: Kafka connect is before logger ready; use ErrorLevel for permanent to avoid silent Fatal
	kafkaWriter, err := gotoolkit.ConnectKafkaWithBackoff(
		context.Background(),
		kafka.WriterConfig{
			Brokers:      []string{getKafkaBrokers()},
			Topic:        getKafkaTopic(),
			RequiredAcks: int(kafka.RequireAll),
		},
		gotoolkit.WithPermanentErrorLogLevel(zapcore.ErrorLevel),
	)
	if err != nil {
		log.Fatalf("failed to connect to kafka: %v", err)
	}

	// Create resource with service identity
	res, err := resource.New(context.Background(),
		resource.WithAttributes(semconv.ServiceName(serviceName)),
	)
	if err != nil {
		log.Fatalf("failed to create resource: %v", err)
	}

	// Initialize OTel logger provider with Kafka exporter
	loggerProvider, err := logger.NewKafkaLoggerProvider(kafkaWriter, res)
	if err != nil {
		log.Fatalf("failed to initialize logger provider: %v", err)
	}

	// Initialize logger (uptrace otelzap wrapping stdout JSON output)
	otelLogger, err := logger.InitLogger(loggerProvider, parseLogLevel(cfg.LogLevel))
	if err != nil {
		log.Fatalf("failed to initialize logger: %v", err)
	}
	otelLogger = otelLogger.WithOptions(zap.Fields(zap.String("service_name", serviceName)))
	defer otelLogger.Sync()
	otelzap.ReplaceGlobals(otelLogger)

	// Initialize TracerProvider (no exporter — trace IDs generated, spans not shipped yet)
	tp := sdktrace.NewTracerProvider(sdktrace.WithResource(res))
	otel.SetTracerProvider(tp)
	tracer := otel.Tracer(serviceName)

	// Initialize database
	svcCtx := logger.WithContext(context.Background(), otelLogger)
	db, err := gotoolkit.ConnectPostgresWithBackoff(svcCtx, cfg.DatabaseURL)
	if err != nil {
		otelLogger.Fatal("failed to connect to postgres", zap.Error(err))
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
		otelLogger.Fatal("failed to run migrations", zap.Error(err))
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

	rabbitmqService, err := service.NewRabbitMQService(svcCtx, rabbitmqURL)
	if err != nil {
		otelLogger.Warn("Failed to connect to RabbitMQ - continuing without message publishing", zap.Error(err))
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
	router.Use(logger.HttpMiddleware(otelLogger))
	router.Use(tracermw.Middleware(tracer))
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
	httpHandler := otelhttp.NewHandler(router, serviceName,
		otelhttp.WithTracerProvider(tp),
	)
	httpServer := &http.Server{
		Addr:         addr,
		Handler:      httpHandler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		otelLogger.Info("Server started", zap.String("address", addr))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			otelLogger.Fatal("server error", zap.Error(err))
		}
	}()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	otelLogger.Info("Shutting down server...")

	// Graceful shutdown with timeout
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		otelLogger.Error("server shutdown error", zap.Error(err))
	}

	// Shutdown TracerProvider
	if err := tp.Shutdown(shutdownCtx); err != nil {
		otelLogger.Error("tracer provider shutdown error", zap.Error(err))
	}

	// Flush and close the OTel log pipeline (drains BatchProcessor, closes Kafka writer)
	if err := loggerProvider.Shutdown(shutdownCtx); err != nil {
		zap.L().Error("logger provider shutdown error", zap.Error(err))
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

	otelLogger.Info("Server stopped")
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

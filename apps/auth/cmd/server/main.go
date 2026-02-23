package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"google.golang.org/grpc"

	"github.com/arpansaha13/goauthkit/pb"
	"github.com/arpansaha13/goauthkit/pkg/config"
	grpccontroller "github.com/arpansaha13/goauthkit/pkg/controller/grpc"
	grpcmiddleware "github.com/arpansaha13/goauthkit/pkg/middleware/grpc"
	"github.com/arpansaha13/goauthkit/pkg/repository"
	"github.com/arpansaha13/goauthkit/pkg/service"
	"github.com/arpansaha13/goauthkit/pkg/utils"
	"github.com/arpansaha13/goauthkit/pkg/worker"
	"github.com/arpansaha13/gotoolkit/logger"
)

func main() {
	// Load configuration from environment variables first
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	// Initialize Kafka writer (owned by loggerProvider after this point — do not close separately)
	kafkaWriter := kafka.NewWriter(kafka.WriterConfig{
		Brokers:      []string{getKafkaBrokers()},
		Topic:        getKafkaTopic(),
		RequiredAcks: int(kafka.RequireAll),
	})

	// Create resource with service identity
	res, err := resource.New(context.Background(),
		resource.WithAttributes(semconv.ServiceName("auth")),
	)
	if err != nil {
		log.Fatalf("failed to create resource: %v", err)
	}

	// Initialize OTel logger provider with Kafka exporter
	loggerProvider, err := logger.NewKafkaLoggerProvider(kafkaWriter, res)
	if err != nil {
		log.Fatalf("failed to initialize logger provider: %v", err)
	}

	// Initialize logger
	otelLogger, err := logger.InitLogger(loggerProvider, parseLogLevel(cfg.LogLevel))
	if err != nil {
		log.Fatalf("failed to initialize logger: %v", err)
	}
	otelLogger = otelLogger.WithOptions(zap.Fields(zap.String("service_name", "auth")))
	defer otelLogger.Sync()
	otelzap.ReplaceGlobals(otelLogger)

	otelLogger.Info("starting auth service", zap.String("environment", cfg.Environment))

	// Initialize database
	db, err := utils.InitDB(cfg.DatabaseURL)
	if err != nil {
		otelLogger.Fatal("failed to initialize database", zap.Error(err))
	}
	defer func() {
		if err := utils.CloseDB(db); err != nil {
			otelLogger.Error("error closing database", zap.Error(err))
		}
	}()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	otpRepo := repository.NewOTPRepository(db)
	sessionRepo := repository.NewSessionRepository(db)

	// Initialize email provider based on environment
	var emailProvider worker.EmailProvider
	if cfg.Environment == "production" {
		emailProvider = worker.NewSMTPEmailProvider(
			cfg.SMTPHost,
			cfg.SMTPPort,
			cfg.SMTPUser,
			cfg.SMTPPassword,
			cfg.EmailFrom,
		)
	} else {
		emailProvider = worker.NewMockEmailProvider()
	}

	// Initialize password hasher and validator
	hasher := utils.NewPasswordHasher()
	validator := utils.NewValidator()

	// Initialize email worker pool
	emailPool := worker.NewEmailWorkerPool(
		cfg.EmailWorkerPoolSize,
		cfg.EmailTaskQueueSize,
		emailProvider,
	)
	defer emailPool.Stop()

	// Initialize auth service
	authService := service.NewAuthService(
		userRepo,
		otpRepo,
		sessionRepo,
		hasher,
		service.AuthServiceConfig{
			OTPExpiry:  cfg.OTPExpiry,
			OTPLength:  cfg.OTPLength,
			SessionTTL: cfg.SessionTTL,
			SecretKey:  cfg.SecretKey,
			EmailPool:  emailPool,
		},
	)

	// Create gRPC server with interceptor chain
	opts := []grpc.ServerOption{
		grpc.ChainUnaryInterceptor(
			grpcmiddleware.RecoveryInterceptor(),
			logger.GrpcInterceptor(),
			grpcmiddleware.ErrorInterceptor(),
		),
	}
	grpcServer := grpc.NewServer(opts...)

	// Register gRPC services
	authController := grpccontroller.NewAuthServiceImpl(authService, validator)

	pb.RegisterAuthServiceServer(grpcServer, authController)

	// Start listening on configured port
	grpcAddr := fmt.Sprintf("%s:%s", cfg.GRPCHost, cfg.GRPCPort)
	listener, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		otelLogger.Fatal("failed to listen", zap.String("address", grpcAddr), zap.Error(err))
	}

	// Start server in goroutine
	go func() {
		otelLogger.Info("starting auth gRPC server", zap.String("address", grpcAddr))
		if err := grpcServer.Serve(listener); err != nil {
			otelLogger.Fatal("gRPC server error", zap.Error(err))
		}
	}()

	// Wait for interrupt signal for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	otelLogger.Info("shutting down auth gRPC server")

	// Graceful shutdown with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	grpcServer.GracefulStop()

	// Flush and close the OTel log pipeline (drains BatchProcessor, closes Kafka writer)
	if err := loggerProvider.Shutdown(shutdownCtx); err != nil {
		zap.L().Error("logger provider shutdown error", zap.Error(err))
	}

	zap.L().Info("auth gRPC server stopped")
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

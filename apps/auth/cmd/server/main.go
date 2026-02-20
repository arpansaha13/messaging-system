package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"go.uber.org/zap"
	"google.golang.org/grpc"

	"github.com/arpansaha13/goauthkit/pb"
	"github.com/arpansaha13/goauthkit/pkg/config"
	grpccontroller "github.com/arpansaha13/goauthkit/pkg/controller/grpc"
	grpcmiddleware "github.com/arpansaha13/goauthkit/pkg/middleware/grpc"
	"github.com/arpansaha13/goauthkit/pkg/repository"
	"github.com/arpansaha13/goauthkit/pkg/service"
	"github.com/arpansaha13/goauthkit/pkg/utils"
	"github.com/arpansaha13/goauthkit/pkg/worker"
)

var (
	environment = flag.String("env", "development", "Environment: development, staging, production")
)

func main() {
	flag.Parse()

	// Initialize zap logger
	zapLogger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("failed to initialize zap logger: %v", err)
	}
	defer zapLogger.Sync()
	zap.ReplaceGlobals(zapLogger)

	// Load configuration from environment variables
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	log.Printf("Starting auth service in %s environment", cfg.Environment)

	// Initialize database
	db, err := utils.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer func() {
		if err := utils.CloseDB(db); err != nil {
			log.Printf("Error closing database: %v", err)
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

	// Create gRPC server with error interceptor
	opts := []grpc.ServerOption{
		grpc.UnaryInterceptor(grpcmiddleware.ErrorInterceptor()),
	}
	grpcServer := grpc.NewServer(opts...)

	// Register gRPC services
	authController := grpccontroller.NewAuthServiceImpl(authService, validator)

	pb.RegisterAuthServiceServer(grpcServer, authController)

	// Start listening on configured port
	grpcAddr := fmt.Sprintf("%s:%s", cfg.GRPCHost, cfg.GRPCPort)
	listener, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		log.Fatalf("Failed to listen on %s: %v", grpcAddr, err)
	}

	// Start server in goroutine
	go func() {
		log.Printf("Starting auth gRPC server on %s", grpcAddr)
		if err := grpcServer.Serve(listener); err != nil {
			log.Fatalf("gRPC server error: %v", err)
		}
	}()

	// Wait for interrupt signal for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down auth gRPC server...")
	grpcServer.GracefulStop()
	log.Println("Auth gRPC server stopped")
}

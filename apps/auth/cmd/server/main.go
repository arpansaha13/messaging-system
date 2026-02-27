package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"google.golang.org/grpc"

	"github.com/arpansaha13/goauthkit/pb"
	goauthkit "github.com/arpansaha13/goauthkit/pkg"
	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/auth/internal/config"
)

func main() {
	// Load configuration from environment variables first
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	// Initialize logger
	zapLogger, err := logger.InitLogger(parseLogLevel(cfg.LogLevel))
	if err != nil {
		log.Fatalf("failed to initialize logger: %v", err)
	}
	defer zapLogger.Sync()
	zap.ReplaceGlobals(zapLogger)

	zapLogger.Info("starting auth service", zap.String("environment", cfg.Environment))

	// Initialize database
	svcCtx := logger.WithContext(context.Background(), zapLogger)
	db, err := gotoolkit.ConnectPostgresWithBackoff(svcCtx, cfg.DatabaseURL)
	if err != nil {
		zapLogger.Fatal("failed to connect to postgres", zap.Error(err))
	}
	defer func() {
		sqlDB, err := db.DB()
		if err == nil {
			sqlDB.Close()
		}
	}()

	// Initialize repositories
	userRepo := goauthkit.NewUserRepository(db)
	otpRepo := goauthkit.NewOTPRepository(db)
	sessionRepo := goauthkit.NewSessionRepository(db)

	// Initialize email provider based on environment
	var emailProvider goauthkit.EmailProvider
	if cfg.Environment == "production" {
		emailProvider = goauthkit.NewSMTPEmailProvider(
			cfg.SMTPHost,
			cfg.SMTPPort,
			cfg.SMTPUser,
			cfg.SMTPPassword,
			cfg.EmailFrom,
		)
	} else {
		emailProvider = goauthkit.NewMockEmailProvider()
	}

	// Initialize password hasher and validator
	hasher := goauthkit.NewPasswordHasher()
	validator := goauthkit.NewValidator()

	// Initialize email worker pool
	emailPool := goauthkit.NewEmailWorkerPool(
		cfg.EmailWorkerPoolSize,
		cfg.EmailTaskQueueSize,
		emailProvider,
	)
	defer emailPool.Stop()

	// Initialize auth service
	authService := goauthkit.NewAuthService(
		userRepo,
		otpRepo,
		sessionRepo,
		hasher,
		goauthkit.AuthServiceConfig{
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
			gotoolkit.GrpcRecoveryInterceptor(),
			logger.GrpcInterceptor(zapLogger),
			gotoolkit.GrpcErrorInterceptor(),
			goauthkit.AuthorizationInterceptor(),
		),
	}
	grpcServer := grpc.NewServer(opts...)

	// Register gRPC services
	authController := goauthkit.NewAuthServiceImpl(authService, validator)

	pb.RegisterAuthServiceServer(grpcServer, authController)

	// Start listening on configured port
	grpcAddr := fmt.Sprintf("%s:%s", cfg.GRPCHost, cfg.GRPCPort)
	listener, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		zapLogger.Fatal("failed to listen", zap.String("address", grpcAddr), zap.Error(err))
	}

	// Start server in goroutine
	go func() {
		zapLogger.Info("starting auth gRPC server", zap.String("address", grpcAddr))
		if err := grpcServer.Serve(listener); err != nil {
			zapLogger.Fatal("gRPC server error", zap.Error(err))
		}
	}()

	// Wait for interrupt signal for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	zapLogger.Info("shutting down auth gRPC server")

	grpcServer.GracefulStop()

	zap.L().Info("auth gRPC server stopped")
}

func parseLogLevel(s string) zapcore.Level {
	var level zapcore.Level
	if err := level.UnmarshalText([]byte(s)); err != nil {
		return zapcore.InfoLevel
	}
	return level
}

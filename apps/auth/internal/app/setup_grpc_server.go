package app

import (
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"gorm.io/gorm"

	"github.com/arpansaha13/goauthkit/pb"
	goauthkit "github.com/arpansaha13/goauthkit/pkg"
	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/auth/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/auth/internal/config"
	"github.com/arpansaha13/messaging-system/apps/common/constants"
)

// SetupGRPCServer wires repositories, email provider, auth service, and gRPC interceptors.
// Returns the server (for Serve/GracefulStop) and the email pool (for Stop on shutdown).
func SetupGRPCServer(cfg *config.Config, db *gorm.DB, zapLogger *zap.Logger, cbs *circuits.Circuits) (*grpc.Server, *goauthkit.EmailWorkerPool) {
	// Initialize repositories
	userRepo := goauthkit.NewUserRepository(db, cbs.Postgres)
	otpRepo := goauthkit.NewOTPRepository(db, cbs.Postgres)
	sessionRepo := goauthkit.NewSessionRepository(db, cbs.Postgres)

	// Initialize email provider based on environment
	var emailProvider goauthkit.EmailProvider
	if cfg.Environment == constants.EnvProduction {
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

	hasher := goauthkit.NewPasswordHasher()
	validator := goauthkit.NewValidator()

	emailPool := goauthkit.NewEmailWorkerPool(
		cfg.EmailWorkerPoolSize,
		cfg.EmailTaskQueueSize,
		emailProvider,
	)

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

	opts := []grpc.ServerOption{
		// otelgrpc stats handler must run before interceptors so span context
		// is present when GrpcInterceptor reads trace_id/span_id.
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
		grpc.ChainUnaryInterceptor(
			gotoolkit.GrpcRecoveryInterceptor(),
			logger.GrpcInterceptor(zapLogger),
			gotoolkit.GrpcErrorInterceptor(),
			goauthkit.AuthorizationInterceptor(),
		),
	}
	grpcServer := grpc.NewServer(opts...)

	authController := goauthkit.NewAuthServiceImpl(authService, validator)
	pb.RegisterAuthServiceServer(grpcServer, authController)

	return grpcServer, emailPool
}

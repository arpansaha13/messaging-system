package app

import (
	"context"
	"github.com/arpansaha13/gotoolkit/gtk"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"gorm.io/gorm"

	"github.com/arpansaha13/goauthkit/pb"
	"github.com/arpansaha13/goauthkit"
	"github.com/arpansaha13/messaging-system/apps/auth/server/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/auth/server/internal/config"
	"github.com/arpansaha13/messaging-system/apps/common/constants"
	commonpb "github.com/arpansaha13/messaging-system/apps/common/pb"
)

// SetupDependencies wires repositories, email provider, the auth service, and the user profile service.
func SetupDependencies(db *gorm.DB, zapLogger *zap.Logger, cbs *circuits.Circuits, memcachedClient *gtk.MemcachedClient) *Dependencies {
	cfg, err := config.Load()
	if err != nil {
		zapLogger.Fatal("failed to load configuration", zap.Error(err))
	}

	userRepo := goauthkit.NewUserRepository(db, cbs.Postgres)
	otpRepo := goauthkit.NewOTPRepository(db, cbs.Postgres)
	sessionRepo := goauthkit.NewSessionRepository(db, cbs.Postgres)
	providerRepo := goauthkit.NewProviderRepository(db, cbs.Postgres)

	var emailProvider goauthkit.EmailProvider
	if cfg.Environment() == constants.EnvProduction {
		emailProvider = goauthkit.NewSMTPEmailProvider(
			cfg.SMTPHost(),
			cfg.SMTPPort(),
			cfg.SMTPUser(),
			cfg.SMTPPassword(),
			cfg.EmailFrom(),
		)
	} else {
		emailProvider = goauthkit.NewMockEmailProvider()
	}

	hasher := goauthkit.NewPasswordHasher()
	validator := goauthkit.NewValidator()

	emailPool := goauthkit.NewEmailWorkerPool(
		cfg.EmailWorkerPoolSize(),
		cfg.EmailTaskQueueSize(),
		emailProvider,
	)

	// Create sessionCache from memcachedClient if available
	var sessionCache goauthkit.ISessionCache
	if memcachedClient != nil && cbs.Cache != nil {
		sessionCache = goauthkit.NewMemcachedSessionCache(memcachedClient, cbs.Cache)
	} else {
		sessionCache = goauthkit.NewInMemorySessionCache()
	}

	// Connect to user service
	userConn, err := grpc.NewClient(cfg.UserServiceGRPCAddr(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		zapLogger.Error("failed to connect to user service", zap.Error(err))
	}
	userProfileClient := commonpb.NewUserProfileServiceClient(userConn)

	// Configure hooks for user profile creation
	hooks := &goauthkit.AuthServiceHooks{
		OnUserCreated: func(ctx context.Context, event goauthkit.UserCreatedEvent) error {
			_, err := userProfileClient.CreateUserProfile(ctx, &commonpb.CreateUserProfileRequest{
				UserId:     event.UserID,
				GlobalName: event.GlobalName,
			})
			if err != nil {
				zapLogger.Error("failed to create user profile via hook",
					zap.Int64("user_id", event.UserID),
					zap.Error(err),
				)
			}
			return err
		},
	}

	authService := goauthkit.NewAuthService(
		userRepo,
		otpRepo,
		sessionRepo,
		providerRepo,
		sessionCache,
		hasher,
		goauthkit.AuthServiceConfig{
			OTPExpiry:  cfg.OTPExpiry(),
			OTPLength:  cfg.OTPLength(),
			SessionTTL: cfg.SessionTTL(),
			SecretKey:  cfg.SecretKey(),
			EmailPool:  emailPool,
		},
		hooks,
	)

	return &Dependencies{
		AuthService:       authService,
		UserProfileClient: userProfileClient,
		Validator:         validator,
		EmailPool:         emailPool,
		EmailProvider:     emailProvider,
	}
}

// SetupGRPCServer configures the gRPC server using the provided dependencies.
func SetupGRPCServer(deps *Dependencies, zapLogger *zap.Logger) *grpc.Server {

	opts := []grpc.ServerOption{
		// otelgrpc stats handler must run before interceptors so span context
		// is present when GrpcInterceptor reads trace_id/span_id.
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
		grpc.ChainUnaryInterceptor(
			gtk.GrpcRecoveryInterceptor(),
			gtk.GrpcLoggerInterceptor(zapLogger),
			gtk.GrpcErrorInterceptor(),
			goauthkit.AuthorizationInterceptor(),
		),
	}
	grpcServer := grpc.NewServer(opts...)

	authController := goauthkit.NewAuthServiceImpl(deps.AuthService, deps.Validator)
	pb.RegisterAuthServiceServer(grpcServer, authController)

	return grpcServer
}

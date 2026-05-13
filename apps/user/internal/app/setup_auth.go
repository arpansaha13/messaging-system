package app

import (
	"github.com/arpansaha13/goauthkit/pb"
	"github.com/arpansaha13/messaging-system/apps/user/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/user/internal/config"
	"github.com/arpansaha13/messaging-system/apps/user/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/user/internal/service"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"gorm.io/gorm"
)

// SetupAuthClient initializes the connection to the auth service.
func SetupAuthClient(cfg *config.Config, zapLogger *zap.Logger, cbs *circuits.Circuits) service.IAuthServiceClient {
	conn, err := grpc.NewClient(cfg.AuthServiceGRPCAddr(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		zapLogger.Fatal("failed to connect to auth service", zap.Error(err))
	}

	client := pb.NewAuthServiceClient(conn)
	authClient := service.NewAuthServiceClient(conn, client, cbs.AuthService)

	return authClient
}

// SetupDependencies wires all components.
func SetupDependencies(cfg *config.Config, db *gorm.DB, zapLogger *zap.Logger, cbs *circuits.Circuits) *Dependencies {
	userProfileRepo := repository.NewUserProfileRepository(db, cbs.Postgres)
	userProfileService := service.NewUserProfileService(userProfileRepo)

	contactRepo := repository.NewContactRepository(db, cbs.Postgres)
	contactService := service.NewContactService(contactRepo, userProfileRepo)

	authClient := SetupAuthClient(cfg, zapLogger, cbs)

	return &Dependencies{
		UserProfileService: userProfileService,
		ContactService:     contactService,
		AuthClient:         authClient,
		ContactRepo:        contactRepo,
	}
}

package app

import (
	"context"
	"fmt"
	"time"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/service"
	"github.com/arpansaha13/messaging-system/apps/common/pb"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// SetupUserService establishes a managed gRPC connection to the user service.
func SetupUserService(
	ctx context.Context,
	log *zap.Logger,
	cbs *circuits.Circuits,
) (*service.UserServiceClient, *gtk.ConnectionManager, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, nil, err
	}

	userClient := service.NewUserServiceClient(nil, nil, cbs.UserGRPC)
	var userConnMgr *gtk.ConnectionManager

	userConnMgr = gtk.NewConnectionManager(
		gtk.ReconnectConfig{
			ConnectTimeout:    10 * time.Second,
			ReconnectInterval: 500 * time.Millisecond,
		},
		log,
		func(connectCtx context.Context) error {
			userConn, err := grpc.NewClient(
				cfg.UserServiceHost(),
				grpc.WithTransportCredentials(insecure.NewCredentials()),
				grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
			)
			if err != nil {
				return fmt.Errorf("failed to connect to user service: %w", err)
			}

			userClient.SetConnection(userConn, pb.NewUserProfileServiceClient(userConn))
			log.Info("user service connected", zap.String("address", cfg.UserServiceHost()))
			return nil
		},
		func() {
			if err := userClient.Close(); err != nil {
				log.Warn("user service close error", zap.Error(err))
			}
		},
	)

	if err := userConnMgr.Start(ctx); err != nil {
		return nil, nil, fmt.Errorf("failed to start user connection manager: %w", err)
	}

	return userClient, userConnMgr, nil
}

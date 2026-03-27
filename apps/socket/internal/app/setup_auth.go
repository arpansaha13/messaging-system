package app

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/service"
	"github.com/arpansaha13/messaging-system/apps/socket/pb"
)

// SetupAuthService establishes a managed gRPC connection to the auth service.
func SetupAuthService(
	ctx context.Context,
	authSystemHost string,
	log *zap.Logger,
	cbs *circuits.Circuits,
) (*service.AuthService, *gotoolkit.ConnectionManager, error) {
	authService := service.NewAuthService(nil, nil, cbs.AuthGRPC)
	var authConnMgr *gotoolkit.ConnectionManager

	authConnMgr = gotoolkit.NewConnectionManager(
		gotoolkit.ReconnectConfig{
			ConnectTimeout:    10 * time.Second,
			ReconnectInterval: 500 * time.Millisecond,
		},
		log,
		func(connectCtx context.Context) error {
			conn, err := grpc.NewClient(
				authSystemHost,
				grpc.WithTransportCredentials(insecure.NewCredentials()),
			)
			if err != nil {
				return fmt.Errorf("failed to connect to auth service: %w", err)
			}
			authService.SetConnection(conn, pb.NewAuthServiceClient(conn))
			log.Info("auth service connected", zap.String("address", authSystemHost))
			return nil
		},
		func() {
			if err := authService.Close(); err != nil {
				log.Warn("auth service close error", zap.Error(err))
			}
		},
	)

	if err := authConnMgr.Start(ctx); err != nil {
		return nil, nil, fmt.Errorf("failed to start auth connection manager: %w", err)
	}

	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := authService.LiveZ(ctx); err != nil {
					log.Warn("auth livez failed, triggering reconnect", zap.Error(err))
					authConnMgr.Signal()
				}
			}
		}
	}()

	return authService, authConnMgr, nil
}

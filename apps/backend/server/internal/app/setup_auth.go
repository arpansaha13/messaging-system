package app

import (
	"context"
	"fmt"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/server/pb"
)

// SetupAuthService establishes a managed gRPC connection to the auth service.
func SetupAuthService(
	ctx context.Context,
	log *zap.Logger,
	cbs *circuits.Circuits,
) (*service.AuthService, *gotoolkit.ConnectionManager, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, nil, err
	}

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
				cfg.AuthSystemHost(),
				grpc.WithTransportCredentials(insecure.NewCredentials()),
				grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
			)
			if err != nil {
				return fmt.Errorf("failed to connect to auth service: %w", err)
			}
			authService.SetConnection(conn, pb.NewAuthServiceClient(conn))
			log.Info("auth service connected", zap.String("address", cfg.AuthSystemHost()))
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

	go runAuthLivezHeartbeat(ctx, authService, authConnMgr, log)

	return authService, authConnMgr, nil
}

func runAuthLivezHeartbeat(
	ctx context.Context,
	authService *service.AuthService,
	authConnMgr *gotoolkit.ConnectionManager,
	log *zap.Logger,
) {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := authService.LiveZ(ctx); err != nil {
				if st, ok := status.FromError(err); ok && st.Code() == codes.Unauthenticated {
					// Temporary compatibility: some auth deployments gate this RPC; reachability is still fine.
					log.Debug("auth livez returned unauthenticated; skipping reconnect")
					continue
				}
				log.Warn("auth livez failed, triggering reconnect", zap.Error(err))
				authConnMgr.Signal()
			}
		}
	}
}

package app

import (
	"fmt"

	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/pb"
)

// SetupAuthService establishes a gRPC connection to the auth service and returns a client.
func SetupAuthService(cbs *circuits.Circuits) (service.IAuthServiceClient, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, err
	}
	conn, err := grpc.NewClient(
		cfg.AuthSystemHost(),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to auth service: %w", err)
	}
	return service.NewAuthService(conn, pb.NewAuthServiceClient(conn), cbs.AuthGRPC), nil
}

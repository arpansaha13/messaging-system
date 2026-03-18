package app

import (
	"fmt"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/arpansaha13/messaging-system/apps/socket/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/service"
	"github.com/arpansaha13/messaging-system/apps/socket/pb"
)

// SetupAuthService establishes a gRPC connection to the auth service and returns a client.
func SetupAuthService(authSystemHost string, cbs *circuits.Circuits) (service.IAuthServiceClient, error) {
	conn, err := grpc.NewClient(
		authSystemHost,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to auth service: %w", err)
	}
	return service.NewAuthService(conn, pb.NewAuthServiceClient(conn), cbs.AuthGRPC), nil
}

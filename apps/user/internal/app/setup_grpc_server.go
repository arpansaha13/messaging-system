package app

import (
	"github.com/arpansaha13/gotoolkit/gtk"
	commonpb "github.com/arpansaha13/messaging-system/apps/common/pb"
	"github.com/arpansaha13/messaging-system/apps/user/internal/controller"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

// SetupGRPCServer configures the gRPC server.
func SetupGRPCServer(deps *Dependencies, zapLogger *zap.Logger) *grpc.Server {
	opts := []grpc.ServerOption{
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
		grpc.ChainUnaryInterceptor(
			gtk.GrpcRecoveryInterceptor(),
			gtk.GrpcLoggerInterceptor(zapLogger),
			gtk.GrpcErrorInterceptor(),
		),
	}
	grpcServer := grpc.NewServer(opts...)

	userProfileController := controller.NewUserProfileController(deps.UserProfileService)
	commonpb.RegisterUserProfileServiceServer(grpcServer, userProfileController)

	return grpcServer
}

package service

import (
	"context"
	"fmt"
	"time"

	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/socket/pb"
)

const defaultTimeout = 10 * time.Second

// AuthService wraps the gRPC auth service client with a circuit breaker.
type AuthService struct {
	conn   *grpc.ClientConn
	client pb.AuthServiceClient
	cb     *gobreaker.CircuitBreaker[any]
}

// NewAuthService creates a new AuthService.
func NewAuthService(conn *grpc.ClientConn, client pb.AuthServiceClient, cb *gobreaker.CircuitBreaker[any]) *AuthService {
	return &AuthService{
		conn:   conn,
		client: client,
		cb:     cb,
	}
}

// ValidateSession validates a session token with the auth service.
func (a *AuthService) ValidateSession(ctx context.Context, token string) (*pb.ValidateSessionResponse, error) {
	log := logger.FromContext(ctx)

	if token == "" {
		log.Warn("validate session called with empty token")
		return nil, fmt.Errorf("empty token")
	}

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	ctxWithMetadata := utils.WithAuthMetadata(ctx, token)
	req := &pb.ValidateSessionRequest{}

	result, err := a.cb.Execute(func() (any, error) {
		return a.client.ValidateSession(ctxWithMetadata, req)
	})

	if err != nil {
		log.Error("failed to validate session", zap.Error(err))
		return nil, fmt.Errorf("failed to validate session: %w", err)
	}

	resp := result.(*pb.ValidateSessionResponse)
	log.Debug("session validated successfully", zap.Int64("user_id", resp.UserId))
	return resp, nil
}

// GetUser retrieves user details from the auth service.
func (a *AuthService) GetUser(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error) {
	log := logger.FromContext(ctx)
	log.Debug("get user request received", zap.Int64("user_id", userID))

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	req := &pb.GetUserRequest{UserId: userID}
	ctxWithMetadata := utils.WithAuthMetadata(ctx, token)

	result, err := a.cb.Execute(func() (any, error) {
		return a.client.GetUser(ctxWithMetadata, req)
	})

	if err != nil {
		log.Error("failed to get user", zap.Int64("user_id", userID), zap.Error(err))
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	resp := result.(*pb.GetUserResponse)
	log.Debug("user info retrieved successfully", zap.Int64("user_id", userID))
	return resp, nil
}

// Close closes the underlying gRPC connection.
func (a *AuthService) Close() error {
	return a.conn.Close()
}

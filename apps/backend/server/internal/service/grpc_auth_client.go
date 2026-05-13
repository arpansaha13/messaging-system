package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/backend/server/pb"
	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

// defaultTimeout is the default timeout for service operations
const defaultTimeout = 10 * time.Second

// AuthServiceClient provides gRPC client methods for the auth service
type AuthServiceClient struct {
	authConn *grpc.ClientConn
	client   pb.AuthServiceClient
	cb       *gobreaker.CircuitBreaker[any]
	mu       sync.RWMutex
}

// NewAuthServiceClient creates a new auth service client
func NewAuthServiceClient(authConn *grpc.ClientConn, client pb.AuthServiceClient, cb *gobreaker.CircuitBreaker[any]) *AuthServiceClient {
	svc := &AuthServiceClient{
		cb: cb,
	}
	svc.SetConnection(authConn, client)
	return svc
}

// SetConnection swaps the underlying gRPC connection and client.
func (a *AuthServiceClient) SetConnection(authConn *grpc.ClientConn, client pb.AuthServiceClient) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.authConn = authConn
	a.client = client
}

func (a *AuthServiceClient) getClient() pb.AuthServiceClient {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.client
}

// ValidateSession validates a session token with the auth service
func (a *AuthServiceClient) ValidateSession(ctx context.Context, token string) (*pb.ValidateSessionResponse, error) {
	log := gtk.LoggerFromContext(ctx)

	if token == "" {
		log.Warn("validate session called with empty token")
		return nil, fmt.Errorf("empty token")
	}

	client := a.getClient()
	if client == nil {
		return nil, fmt.Errorf("auth service client not connected")
	}

	log.Debug("validating session token with auth service")

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	// Add token to context as metadata for gRPC request
	ctxWithMetadata := utils.WithAuthMetadata(ctx, token)

	req := &pb.ValidateSessionRequest{}

	result, err := a.cb.Execute(func() (any, error) {
		return client.ValidateSession(ctxWithMetadata, req)
	})

	if err != nil {
		log.Error("failed to validate session", zap.Error(err))
		return nil, fmt.Errorf("failed to validate session: %w", err)
	}

	resp := result.(*pb.ValidateSessionResponse)
	log.Debug("session validated successfully", zap.Int64("user_id", resp.UserId))
	return resp, nil
}

// GetUser retrieves user information from the auth service
func (a *AuthServiceClient) GetUser(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error) {
	log := gtk.LoggerFromContext(ctx)
	log.Debug("get user request received", zap.Int64("user_id", userID))

	client := a.getClient()
	if client == nil {
		return nil, fmt.Errorf("auth service client not connected")
	}

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	req := &pb.GetUserRequest{UserId: userID}

	// Add token to context as metadata for gRPC request
	ctxWithMetadata := utils.WithAuthMetadata(ctx, token)

	result, err := a.cb.Execute(func() (any, error) {
		return client.GetUser(ctxWithMetadata, req)
	})

	if err != nil {
		log.Error("failed to get user", zap.Int64("user_id", userID), zap.Error(err))
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	resp := result.(*pb.GetUserResponse)
	log.Debug("user info retrieved successfully", zap.Int64("user_id", userID))
	return resp, nil
}

// Close closes the gRPC connection
func (a *AuthServiceClient) Close() error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.authConn != nil {
		if err := a.authConn.Close(); err != nil {
			return err
		}
	}
	a.authConn = nil
	a.client = nil
	return nil
}

// LiveZ probes the auth service for liveness.
func (a *AuthServiceClient) LiveZ(ctx context.Context) error {
	client := a.getClient()
	if client == nil {
		return fmt.Errorf("auth service client not connected")
	}
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if _, err := client.LiveZ(ctx, &pb.LiveZRequest{}); err != nil {
		return fmt.Errorf("auth livez failed: %w", err)
	}
	return nil
}

var _ IAuthServiceClient = (*AuthServiceClient)(nil)

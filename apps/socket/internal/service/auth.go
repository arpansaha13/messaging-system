package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/socket/pb"
	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

const defaultTimeout = 10 * time.Second

// AuthService wraps the gRPC auth service client with a circuit breaker.
type AuthService struct {
	conn   *grpc.ClientConn
	client pb.AuthServiceClient
	cb     *gobreaker.CircuitBreaker[any]
	mu     sync.RWMutex
}

// NewAuthService creates a new AuthService.
func NewAuthService(conn *grpc.ClientConn, client pb.AuthServiceClient, cb *gobreaker.CircuitBreaker[any]) *AuthService {
	svc := &AuthService{
		cb: cb,
	}
	svc.SetConnection(conn, client)
	return svc
}

// SetConnection swaps the underlying gRPC connection and client.
func (a *AuthService) SetConnection(conn *grpc.ClientConn, client pb.AuthServiceClient) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.conn = conn
	a.client = client
}

func (a *AuthService) getClient() pb.AuthServiceClient {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.client
}

// ValidateSession validates a session token with the auth service.
func (a *AuthService) ValidateSession(ctx context.Context, token string) (*pb.ValidateSessionResponse, error) {
	log := gtk.LoggerFromContext(ctx)

	if token == "" {
		log.Warn("validate session called with empty token")
		return nil, fmt.Errorf("empty token")
	}

	client := a.getClient()
	if client == nil {
		return nil, fmt.Errorf("auth service client not connected")
	}

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

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

// GetUser retrieves user details from the auth service.
func (a *AuthService) GetUser(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error) {
	log := gtk.LoggerFromContext(ctx)
	log.Debug("get user request received", zap.Int64("user_id", userID))

	client := a.getClient()
	if client == nil {
		return nil, fmt.Errorf("auth service client not connected")
	}

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	req := &pb.GetUserRequest{UserId: userID}
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

// Close closes the underlying gRPC connection.
func (a *AuthService) Close() error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.conn == nil {
		a.client = nil
		return nil
	}
	err := a.conn.Close()
	a.conn = nil
	a.client = nil
	return err
}

// LiveZ probes the auth service for liveness.
func (a *AuthService) LiveZ(ctx context.Context) error {
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

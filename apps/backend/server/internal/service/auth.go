package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/backend/server/pb"
	"github.com/arpansaha13/messaging-system/apps/common/coalesce"
	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
	"golang.org/x/sync/singleflight"
	"google.golang.org/grpc"
)

// defaultTimeout is the default timeout for service operations
const defaultTimeout = 10 * time.Second

// AuthService provides gRPC client methods for the auth service
type AuthService struct {
	conn   *grpc.ClientConn
	client pb.AuthServiceClient
	cb     *gobreaker.CircuitBreaker[any]
	mu     sync.RWMutex
	sf     singleflight.Group
}

// NewAuthService creates a new auth service
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

// ValidateSession validates a session token with the auth service
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

	log.Debug("validating session token with auth service")

	key := coalesce.ValidateSessionKey(token)

	ch := a.sf.DoChan(key, func() (any, error) {
		detachedCtx := context.WithoutCancel(ctx)
		detachedCtx, cancel := context.WithTimeout(detachedCtx, defaultTimeout)
		defer cancel()

		ctxWithMetadata := utils.WithAuthMetadata(detachedCtx, token)
		req := &pb.ValidateSessionRequest{}

		return a.cb.Execute(func() (any, error) {
			return client.ValidateSession(ctxWithMetadata, req)
		})
	})

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-ch:
		if res.Err != nil {
			log.Error("failed to validate session", zap.Error(res.Err))
			return nil, fmt.Errorf("failed to validate session: %w", res.Err)
		}
		resp := res.Val.(*pb.ValidateSessionResponse)
		log.Debug("session validated successfully", zap.Int64("user_id", resp.UserId))
		return resp, nil
	}
}

// GetUser retrieves user information from the auth service
func (a *AuthService) GetUser(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error) {
	log := gtk.LoggerFromContext(ctx)
	log.Debug("get user request received", zap.Int64("user_id", userID))

	client := a.getClient()
	if client == nil {
		return nil, fmt.Errorf("auth service client not connected")
	}

	key := coalesce.GetUserKey(userID)

	ch := a.sf.DoChan(key, func() (any, error) {
		detachedCtx := context.WithoutCancel(ctx)
		detachedCtx, cancel := context.WithTimeout(detachedCtx, defaultTimeout)
		defer cancel()

		req := &pb.GetUserRequest{UserId: userID}
		ctxWithMetadata := utils.WithAuthMetadata(detachedCtx, token)

		return a.cb.Execute(func() (any, error) {
			return client.GetUser(ctxWithMetadata, req)
		})
	})

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-ch:
		if res.Err != nil {
			log.Error("failed to get user", zap.Int64("user_id", userID), zap.Error(res.Err))
			return nil, fmt.Errorf("failed to get user: %w", res.Err)
		}
		resp := res.Val.(*pb.GetUserResponse)
		log.Debug("user info retrieved successfully", zap.Int64("user_id", userID))
		return resp, nil
	}
}

// Close closes the gRPC connection
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

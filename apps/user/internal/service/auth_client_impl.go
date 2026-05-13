package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/arpansaha13/goauthkit/pb"
	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/user/internal/utils"
	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

const defaultTimeout = 10 * time.Second

// AuthServiceClient implementation.
type AuthServiceClient struct {
	conn   *grpc.ClientConn
	client pb.AuthServiceClient
	cb     *gobreaker.CircuitBreaker[any]
	mu     sync.RWMutex
}

// NewAuthServiceClient creates a new AuthServiceClient.
func NewAuthServiceClient(conn *grpc.ClientConn, client pb.AuthServiceClient, cb *gobreaker.CircuitBreaker[any]) *AuthServiceClient {
	return &AuthServiceClient{
		conn:   conn,
		client: client,
		cb:     cb,
	}
}

func (a *AuthServiceClient) getClient() pb.AuthServiceClient {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.client
}

func (a *AuthServiceClient) ValidateSession(ctx context.Context, token string) (*pb.ValidateSessionResponse, error) {
	log := gtk.LoggerFromContext(ctx)
	client := a.getClient()
	if client == nil {
		return nil, fmt.Errorf("auth service client not connected")
	}

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	ctxWithMetadata := utils.WithAuthMetadata(ctx, token)

	result, err := a.cb.Execute(func() (any, error) {
		return client.ValidateSession(ctxWithMetadata, &pb.ValidateSessionRequest{})
	})

	if err != nil {
		log.Error("failed to validate session", zap.Error(err))
		return nil, err
	}

	return result.(*pb.ValidateSessionResponse), nil
}

func (a *AuthServiceClient) GetUser(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error) {
	log := gtk.LoggerFromContext(ctx)
	client := a.getClient()
	if client == nil {
		return nil, fmt.Errorf("auth service client not connected")
	}

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	ctxWithMetadata := utils.WithAuthMetadata(ctx, token)

	result, err := a.cb.Execute(func() (any, error) {
		return client.GetUser(ctxWithMetadata, &pb.GetUserRequest{UserId: userID})
	})

	if err != nil {
		log.Error("failed to get user", zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}

	return result.(*pb.GetUserResponse), nil
}

func (a *AuthServiceClient) Close() error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.conn == nil {
		return nil
	}
	err := a.conn.Close()
	a.conn = nil
	a.client = nil
	return err
}

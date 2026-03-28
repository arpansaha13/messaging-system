package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/backend/server/pb"
)

// defaultTimeout is the default timeout for service operations
const defaultTimeout = 10 * time.Second

// AuthService provides gRPC client methods for the auth service
type AuthService struct {
	conn   *grpc.ClientConn
	client pb.AuthServiceClient
	cb     *gobreaker.CircuitBreaker[any]
	mu     sync.RWMutex
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
	log := logger.FromContext(ctx)

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

// Signup registers a new user with the auth service
func (a *AuthService) Signup(ctx context.Context, email, password string) (*pb.SignupResponse, error) {
	log := logger.FromContext(ctx)
	log.Debug("signup request received", zap.String("email", email))

	client := a.getClient()
	if client == nil {
		return nil, fmt.Errorf("auth service client not connected")
	}

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	req := &pb.SignupRequest{
		Email:    email,
		Password: password,
	}

	result, err := a.cb.Execute(func() (any, error) {
		return client.Signup(ctx, req)
	})

	if err != nil {
		log.Error("signup failed", zap.String("email", email), zap.Error(err))
		return nil, fmt.Errorf("signup failed: %w", err)
	}

	resp := result.(*pb.SignupResponse)
	log.Info("user signup successful", zap.String("email", email))
	return resp, nil
}

// Login authenticates a user with the auth service
func (a *AuthService) Login(ctx context.Context, email, password string) (*pb.LoginResponse, error) {
	log := logger.FromContext(ctx)
	log.Debug("login request received", zap.String("email", email))

	client := a.getClient()
	if client == nil {
		return nil, fmt.Errorf("auth service client not connected")
	}

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	req := &pb.LoginRequest{
		Email:    email,
		Password: password,
	}

	result, err := a.cb.Execute(func() (any, error) {
		return client.Login(ctx, req)
	})

	if err != nil {
		log.Warn("login failed", zap.String("email", email), zap.Error(err))
		return nil, fmt.Errorf("login failed: %w", err)
	}

	resp := result.(*pb.LoginResponse)
	log.Info("user login successful", zap.String("email", email))
	return resp, nil
}

// VerifyOTP verifies an OTP code with the auth service
func (a *AuthService) VerifyOTP(ctx context.Context, otpHash, code string) (*pb.VerifyOTPResponse, error) {
	log := logger.FromContext(ctx)
	log.Debug("verify OTP request received")

	client := a.getClient()
	if client == nil {
		return nil, fmt.Errorf("auth service client not connected")
	}

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	req := &pb.VerifyOTPRequest{
		OtpHash: otpHash,
		Code:    code,
	}

	result, err := a.cb.Execute(func() (any, error) {
		return client.VerifyOTP(ctx, req)
	})

	if err != nil {
		log.Warn("OTP verification failed", zap.Error(err))
		return nil, fmt.Errorf("verify otp failed: %w", err)
	}

	resp := result.(*pb.VerifyOTPResponse)
	log.Info("OTP verified successfully")
	return resp, nil
}

// Logout logs out a user session with the auth service
func (a *AuthService) Logout(ctx context.Context, token string) (*pb.LogoutResponse, error) {
	log := logger.FromContext(ctx)

	if token == "" {
		log.Warn("logout called with empty token")
		return nil, fmt.Errorf("empty token")
	}

	client := a.getClient()
	if client == nil {
		return nil, fmt.Errorf("auth service client not connected")
	}

	log.Debug("logout request received")

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	// Add token to context as metadata for gRPC request
	ctxWithMetadata := utils.WithAuthMetadata(ctx, token)

	req := &pb.LogoutRequest{}

	result, err := a.cb.Execute(func() (any, error) {
		return client.Logout(ctxWithMetadata, req)
	})

	if err != nil {
		log.Error("logout failed", zap.Error(err))
		return nil, fmt.Errorf("failed to logout: %w", err)
	}

	resp := result.(*pb.LogoutResponse)
	log.Info("user logout successful")
	return resp, nil
}

// GetUser retrieves user information from the auth service
func (a *AuthService) GetUser(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error) {
	log := logger.FromContext(ctx)
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

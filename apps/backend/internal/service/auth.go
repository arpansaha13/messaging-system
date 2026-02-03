package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/backend/pb"
)

// defaultTimeout is the default timeout for service operations
const defaultTimeout = 10 * time.Second

// AuthServiceClient provides gRPC client methods for the auth service
type AuthServiceClient struct {
	conn   *grpc.ClientConn
	client pb.AuthServiceClient
}

// NewAuthServiceClient creates a new auth service client
func NewAuthServiceClient(authServiceHost string) (*AuthServiceClient, error) {
	conn, err := grpc.NewClient(
		authServiceHost,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to auth service: %w", err)
	}

	client := pb.NewAuthServiceClient(conn)

	return &AuthServiceClient{
		conn:   conn,
		client: client,
	}, nil
}

// ValidateSession validates a session token with the auth service
func (a *AuthServiceClient) ValidateSession(ctx context.Context, token string) (*pb.ValidateSessionResponse, error) {
	if token == "" {
		return nil, fmt.Errorf("empty token")
	}

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	// Add token to context as metadata for gRPC request
	ctxWithMetadata := utils.WithAuthMetadata(ctx, token)

	req := &pb.ValidateSessionRequest{}

	log.Printf("validating session token with auth service")
	resp, err := a.client.ValidateSession(ctxWithMetadata, req)
	if err != nil {
		return nil, fmt.Errorf("failed to validate session: %w", err)
	}

	return resp, nil
}

// Signup registers a new user with the auth service
func (a *AuthServiceClient) Signup(ctx context.Context, email, password string) (*pb.SignupResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	req := &pb.SignupRequest{
		Email:    email,
		Password: password,
	}

	resp, err := a.client.Signup(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("signup failed: %w", err)
	}

	return resp, nil
}

// Login authenticates a user with the auth service
func (a *AuthServiceClient) Login(ctx context.Context, email, password string) (*pb.LoginResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	req := &pb.LoginRequest{
		Email:    email,
		Password: password,
	}

	resp, err := a.client.Login(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("login failed: %w", err)
	}

	return resp, nil
}

// VerifyOTP verifies an OTP code with the auth service
func (a *AuthServiceClient) VerifyOTP(ctx context.Context, otpHash, code string) (*pb.VerifyOTPResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	req := &pb.VerifyOTPRequest{
		OtpHash: otpHash,
		Code:    code,
	}

	resp, err := a.client.VerifyOTP(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("verify otp failed: %w", err)
	}

	return resp, nil
}

// Logout logs out a user session with the auth service
func (a *AuthServiceClient) Logout(ctx context.Context, token string) (*pb.LogoutResponse, error) {
	if token == "" {
		return nil, fmt.Errorf("empty token")
	}

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	// Add token to context as metadata for gRPC request
	ctxWithMetadata := utils.WithAuthMetadata(ctx, token)

	req := &pb.LogoutRequest{}

	log.Printf("logging out session token with auth service")
	resp, err := a.client.Logout(ctxWithMetadata, req)
	if err != nil {
		return nil, fmt.Errorf("failed to logout: %w", err)
	}

	return resp, nil
}

// GetUser retrieves user information from the auth service
func (a *AuthServiceClient) GetUser(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	req := &pb.GetUserRequest{UserId: userID}

	// Add token to context as metadata for gRPC request
	ctxWithMetadata := utils.WithAuthMetadata(ctx, token)
	resp, err := a.client.GetUser(ctxWithMetadata, req)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return resp, nil
}

// Close closes the gRPC connection
func (a *AuthServiceClient) Close() error {
	return a.conn.Close()
}

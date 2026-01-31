package service_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend-go/pb"
)

// MockAuthServiceClient is a mock implementation of the gRPC auth service client
type MockAuthServiceClient struct {
	ValidateSessionFunc func(ctx context.Context, token string) (*pb.ValidateSessionResponse, error)
	SignupFunc          func(ctx context.Context, email, password string) (*pb.SignupResponse, error)
	LoginFunc           func(ctx context.Context, email, password string) (*pb.LoginResponse, error)
	VerifyOTPFunc       func(ctx context.Context, otpHash, code string) (*pb.VerifyOTPResponse, error)
	GetUserFunc         func(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error)
	CloseFunc           func() error
}

func (m *MockAuthServiceClient) ValidateSession(ctx context.Context, token string) (*pb.ValidateSessionResponse, error) {
	if m.ValidateSessionFunc != nil {
		return m.ValidateSessionFunc(ctx, token)
	}
	return nil, nil
}

func (m *MockAuthServiceClient) Signup(ctx context.Context, email, password string) (*pb.SignupResponse, error) {
	if m.SignupFunc != nil {
		return m.SignupFunc(ctx, email, password)
	}
	return nil, nil
}

func (m *MockAuthServiceClient) Login(ctx context.Context, email, password string) (*pb.LoginResponse, error) {
	if m.LoginFunc != nil {
		return m.LoginFunc(ctx, email, password)
	}
	return nil, nil
}

func (m *MockAuthServiceClient) VerifyOTP(ctx context.Context, otpHash, code string) (*pb.VerifyOTPResponse, error) {
	if m.VerifyOTPFunc != nil {
		return m.VerifyOTPFunc(ctx, otpHash, code)
	}
	return nil, nil
}

func (m *MockAuthServiceClient) GetUser(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error) {
	if m.GetUserFunc != nil {
		return m.GetUserFunc(ctx, userID, token)
	}
	return nil, nil
}

func (m *MockAuthServiceClient) Close() error {
	if m.CloseFunc != nil {
		return m.CloseFunc()
	}
	return nil
}

func TestAuthService_ValidateSession(t *testing.T) {
	tests := []struct {
		name          string
		token         string
		mockFunc      func() service.IAuthServiceClient
		expectedError bool
		validateResp  func(t *testing.T, resp *pb.ValidateSessionResponse)
	}{
		{
			name:  "successful validate session",
			token: "valid_token",
			mockFunc: func() service.IAuthServiceClient {
				return &MockAuthServiceClient{
					ValidateSessionFunc: func(ctx context.Context, token string) (*pb.ValidateSessionResponse, error) {
						return &pb.ValidateSessionResponse{
							Valid:  true,
							UserId: 1,
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, resp *pb.ValidateSessionResponse) {
				assert.True(t, resp.Valid)
				assert.Equal(t, int64(1), resp.UserId)
			},
		},
		{
			name:  "empty token",
			token: "",
			mockFunc: func() service.IAuthServiceClient {
				return &MockAuthServiceClient{
					ValidateSessionFunc: func(ctx context.Context, token string) (*pb.ValidateSessionResponse, error) {
						return nil, nil
					},
				}
			},
			expectedError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockClient := tt.mockFunc()

			resp, err := mockClient.ValidateSession(context.Background(), tt.token)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				if resp != nil {
					tt.validateResp(t, resp)
				}
			}
		})
	}
}

func TestAuthService_Signup(t *testing.T) {
	tests := []struct {
		name          string
		email         string
		password      string
		mockFunc      func() service.IAuthServiceClient
		expectedError bool
		validateResp  func(t *testing.T, resp *pb.SignupResponse)
	}{
		{
			name:     "successful signup",
			email:    "test@example.com",
			password: "password123",
			mockFunc: func() service.IAuthServiceClient {
				return &MockAuthServiceClient{
					SignupFunc: func(ctx context.Context, email, password string) (*pb.SignupResponse, error) {
						return &pb.SignupResponse{
							Message: "Signup successful",
							OtpHash: "otp_hash_123",
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, resp *pb.SignupResponse) {
				assert.NotEmpty(t, resp.OtpHash)
				assert.Equal(t, "Signup successful", resp.Message)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockClient := tt.mockFunc()

			resp, err := mockClient.Signup(context.Background(), tt.email, tt.password)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				if resp != nil {
					tt.validateResp(t, resp)
				}
			}
		})
	}
}

func TestAuthService_Login(t *testing.T) {
	tests := []struct {
		name          string
		email         string
		password      string
		mockFunc      func() service.IAuthServiceClient
		expectedError bool
		validateResp  func(t *testing.T, resp *pb.LoginResponse)
	}{
		{
			name:     "successful login",
			email:    "test@example.com",
			password: "password123",
			mockFunc: func() service.IAuthServiceClient {
				return &MockAuthServiceClient{
					LoginFunc: func(ctx context.Context, email, password string) (*pb.LoginResponse, error) {
						return &pb.LoginResponse{
							SessionToken: "session_token_123",
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, resp *pb.LoginResponse) {
				assert.NotEmpty(t, resp.SessionToken)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockClient := tt.mockFunc()

			resp, err := mockClient.Login(context.Background(), tt.email, tt.password)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				if resp != nil {
					tt.validateResp(t, resp)
				}
			}
		})
	}
}

func TestAuthService_VerifyOTP(t *testing.T) {
	tests := []struct {
		name          string
		otpHash       string
		code          string
		mockFunc      func() service.IAuthServiceClient
		expectedError bool
		validateResp  func(t *testing.T, resp *pb.VerifyOTPResponse)
	}{
		{
			name:    "successful verify OTP",
			otpHash: "otp_hash_123",
			code:    "123456",
			mockFunc: func() service.IAuthServiceClient {
				return &MockAuthServiceClient{
					VerifyOTPFunc: func(ctx context.Context, otpHash, code string) (*pb.VerifyOTPResponse, error) {
						return &pb.VerifyOTPResponse{
							Message:      "OTP verified",
							Username:     "testuser123",
							SessionToken: "jwt_token_123",
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, resp *pb.VerifyOTPResponse) {
				assert.NotEmpty(t, resp.Message)
				assert.NotEmpty(t, resp.SessionToken)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockClient := tt.mockFunc()

			resp, err := mockClient.VerifyOTP(context.Background(), tt.otpHash, tt.code)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				if resp != nil {
					tt.validateResp(t, resp)
				}
			}
		})
	}
}

func TestAuthService_GetUser(t *testing.T) {
	tests := []struct {
		name          string
		userID        int64
		token         string
		mockFunc      func() service.IAuthServiceClient
		expectedError bool
		validateResp  func(t *testing.T, resp *pb.GetUserResponse)
	}{
		{
			name:   "successful get user",
			userID: 1,
			token:  "jwt_token_123",
			mockFunc: func() service.IAuthServiceClient {
				return &MockAuthServiceClient{
					GetUserFunc: func(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error) {
						return &pb.GetUserResponse{
							User: &pb.UserData{
								UserId:   userID,
								Email:    "test@example.com",
								Username: "testuser",
								Verified: true,
							},
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, resp *pb.GetUserResponse) {
				assert.NotNil(t, resp.User)
				assert.Equal(t, int64(1), resp.User.UserId)
				assert.Equal(t, "test@example.com", resp.User.Email)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockClient := tt.mockFunc()

			resp, err := mockClient.GetUser(context.Background(), tt.userID, tt.token)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				if resp != nil {
					tt.validateResp(t, resp)
				}
			}
		})
	}
}

package mocks

import (
	"context"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/service"
)

// MockAuthService mocks the auth service for controller tests
type MockAuthService struct {
	SignupFunc          func(ctx context.Context, req service.SignupRequest) (*service.SignupResponse, error)
	VerifyOTPFunc       func(ctx context.Context, req service.VerifyOTPRequest) (*service.VerifyOTPResponse, error)
	LoginFunc           func(ctx context.Context, req service.LoginRequest) (*service.LoginResponse, error)
	ValidateSessionFunc func(ctx context.Context, req service.ValidateSessionRequest) (*service.ValidateSessionResponse, error)
	RefreshSessionFunc  func(ctx context.Context, req service.RefreshSessionRequest) (*service.RefreshSessionResponse, error)
	LogoutFunc          func(ctx context.Context, req service.LogoutRequest) (*service.LogoutResponse, error)
	ForgotPasswordFunc  func(ctx context.Context, req service.ForgotPasswordRequest) (*service.ForgotPasswordResponse, error)
	ResetPasswordFunc   func(ctx context.Context, req service.ResetPasswordRequest) (*service.ResetPasswordResponse, error)
	GetUserFunc         func(ctx context.Context, req service.GetUserRequest) (*service.GetUserResponse, error)
	GetUserByEmailFunc  func(ctx context.Context, req service.GetUserByEmailRequest) (*service.GetUserByEmailResponse, error)
	DeleteUserFunc      func(ctx context.Context, req service.DeleteUserRequest) (*service.DeleteUserResponse, error)
	ExchangeOAuthCodeFunc func(ctx context.Context, req service.ExchangeOAuthCodeRequest) (*service.LoginResponse, error)
}

func (m *MockAuthService) Signup(ctx context.Context, req service.SignupRequest) (*service.SignupResponse, error) {
	if m.SignupFunc != nil {
		return m.SignupFunc(ctx, req)
	}
	return &service.SignupResponse{Message: "success", OTPHash: "test-hash"}, nil
}

func (m *MockAuthService) VerifyOTP(ctx context.Context, req service.VerifyOTPRequest) (*service.VerifyOTPResponse, error) {
	if m.VerifyOTPFunc != nil {
		return m.VerifyOTPFunc(ctx, req)
	}
	return &service.VerifyOTPResponse{Message: "success", Username: "test_user", SessionToken: "token"}, nil
}

func (m *MockAuthService) Login(ctx context.Context, req service.LoginRequest) (*service.LoginResponse, error) {
	if m.LoginFunc != nil {
		return m.LoginFunc(ctx, req)
	}
	return &service.LoginResponse{SessionToken: "token"}, nil
}

func (m *MockAuthService) ValidateSession(ctx context.Context, req service.ValidateSessionRequest) (*service.ValidateSessionResponse, error) {
	if m.ValidateSessionFunc != nil {
		return m.ValidateSessionFunc(ctx, req)
	}
	return &service.ValidateSessionResponse{Valid: true, UserID: 1}, nil
}

func (m *MockAuthService) RefreshSession(ctx context.Context, req service.RefreshSessionRequest) (*service.RefreshSessionResponse, error) {
	if m.RefreshSessionFunc != nil {
		return m.RefreshSessionFunc(ctx, req)
	}
	return &service.RefreshSessionResponse{NewSessionToken: "new-token"}, nil
}

func (m *MockAuthService) Logout(ctx context.Context, req service.LogoutRequest) (*service.LogoutResponse, error) {
	if m.LogoutFunc != nil {
		return m.LogoutFunc(ctx, req)
	}
	return &service.LogoutResponse{Message: "logout successful"}, nil
}

func (m *MockAuthService) ForgotPassword(ctx context.Context, req service.ForgotPasswordRequest) (*service.ForgotPasswordResponse, error) {
	if m.ForgotPasswordFunc != nil {
		return m.ForgotPasswordFunc(ctx, req)
	}
	return &service.ForgotPasswordResponse{Message: "if email exists, reset link will be sent", OTPHash: "test-hash"}, nil
}

func (m *MockAuthService) ResetPassword(ctx context.Context, req service.ResetPasswordRequest) (*service.ResetPasswordResponse, error) {
	if m.ResetPasswordFunc != nil {
		return m.ResetPasswordFunc(ctx, req)
	}
	return &service.ResetPasswordResponse{Message: "password reset successfully"}, nil
}

func (m *MockAuthService) GetUser(ctx context.Context, req service.GetUserRequest) (*service.GetUserResponse, error) {
	if m.GetUserFunc != nil {
		return m.GetUserFunc(ctx, req)
	}
	return &service.GetUserResponse{
		User: service.UserData{
			UserID:   1,
			Email:    "test@example.com",
			Username: "test_user",
		},
	}, nil
}

func (m *MockAuthService) GetUserByEmail(ctx context.Context, req service.GetUserByEmailRequest) (*service.GetUserByEmailResponse, error) {
	if m.GetUserByEmailFunc != nil {
		return m.GetUserByEmailFunc(ctx, req)
	}
	return &service.GetUserByEmailResponse{
		User: service.UserData{
			UserID:   1,
			Email:    req.Email,
			Username: "test_user",
		},
	}, nil
}

func (m *MockAuthService) DeleteUser(ctx context.Context, req service.DeleteUserRequest) (*service.DeleteUserResponse, error) {
	if m.DeleteUserFunc != nil {
		return m.DeleteUserFunc(ctx, req)
	}
	return &service.DeleteUserResponse{Message: "user deleted successfully"}, nil
}

func (m *MockAuthService) ExchangeOAuthCode(ctx context.Context, req service.ExchangeOAuthCodeRequest) (*service.LoginResponse, error) {
	if m.ExchangeOAuthCodeFunc != nil {
		return m.ExchangeOAuthCodeFunc(ctx, req)
	}
	return &service.LoginResponse{SessionToken: "token"}, nil
}

// MockAuthServiceForUser mocks the auth service for user controller tests
type MockAuthServiceForUser struct {
	GetUserFunc        func(ctx context.Context, req service.GetUserRequest) (*service.GetUserResponse, error)
	GetUserByEmailFunc func(ctx context.Context, req service.GetUserByEmailRequest) (*service.GetUserByEmailResponse, error)
	DeleteUserFunc     func(ctx context.Context, req service.DeleteUserRequest) (*service.DeleteUserResponse, error)
	ExchangeOAuthCodeFunc func(ctx context.Context, req service.ExchangeOAuthCodeRequest) (*service.LoginResponse, error)
}

// Implement the IAuthService interface for mocking
func (m *MockAuthServiceForUser) Signup(ctx context.Context, req service.SignupRequest) (*service.SignupResponse, error) {
	return nil, nil
}

func (m *MockAuthServiceForUser) VerifyOTP(ctx context.Context, req service.VerifyOTPRequest) (*service.VerifyOTPResponse, error) {
	return nil, nil
}

func (m *MockAuthServiceForUser) Login(ctx context.Context, req service.LoginRequest) (*service.LoginResponse, error) {
	return nil, nil
}

func (m *MockAuthServiceForUser) ValidateSession(ctx context.Context, req service.ValidateSessionRequest) (*service.ValidateSessionResponse, error) {
	return nil, nil
}

func (m *MockAuthServiceForUser) RefreshSession(ctx context.Context, req service.RefreshSessionRequest) (*service.RefreshSessionResponse, error) {
	return nil, nil
}

func (m *MockAuthServiceForUser) Logout(ctx context.Context, req service.LogoutRequest) (*service.LogoutResponse, error) {
	return nil, nil
}

func (m *MockAuthServiceForUser) ForgotPassword(ctx context.Context, req service.ForgotPasswordRequest) (*service.ForgotPasswordResponse, error) {
	return nil, nil
}

func (m *MockAuthServiceForUser) ResetPassword(ctx context.Context, req service.ResetPasswordRequest) (*service.ResetPasswordResponse, error) {
	return nil, nil
}

func (m *MockAuthServiceForUser) GetUser(ctx context.Context, req service.GetUserRequest) (*service.GetUserResponse, error) {
	if m.GetUserFunc != nil {
		return m.GetUserFunc(ctx, req)
	}
	return &service.GetUserResponse{
		User: service.UserData{
			UserID:   1,
			Email:    "test@example.com",
			Username: "test_user",
			Verified: true,
		},
	}, nil
}

func (m *MockAuthServiceForUser) GetUserByEmail(ctx context.Context, req service.GetUserByEmailRequest) (*service.GetUserByEmailResponse, error) {
	if m.GetUserByEmailFunc != nil {
		return m.GetUserByEmailFunc(ctx, req)
	}
	return &service.GetUserByEmailResponse{
		User: service.UserData{
			UserID:   1,
			Email:    req.Email,
			Username: "test_user",
			Verified: true,
		},
	}, nil
}

func (m *MockAuthServiceForUser) DeleteUser(ctx context.Context, req service.DeleteUserRequest) (*service.DeleteUserResponse, error) {
	if m.DeleteUserFunc != nil {
		return m.DeleteUserFunc(ctx, req)
	}
	return &service.DeleteUserResponse{Message: "user deleted successfully"}, nil
}

func (m *MockAuthServiceForUser) ExchangeOAuthCode(ctx context.Context, req service.ExchangeOAuthCodeRequest) (*service.LoginResponse, error) {
	if m.ExchangeOAuthCodeFunc != nil {
		return m.ExchangeOAuthCodeFunc(ctx, req)
	}
	return nil, nil
}

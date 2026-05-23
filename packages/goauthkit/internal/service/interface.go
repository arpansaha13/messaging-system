package service

import "context"

// IAuthService defines the interface for auth service
type IAuthService interface {
	Signup(ctx context.Context, req SignupRequest) (*SignupResponse, error)
	VerifyOTP(ctx context.Context, req VerifyOTPRequest) (*VerifyOTPResponse, error)
	Login(ctx context.Context, req LoginRequest) (*LoginResponse, error)
	ExchangeOAuthCode(ctx context.Context, req ExchangeOAuthCodeRequest) (*LoginResponse, error)
	ValidateSession(ctx context.Context, req ValidateSessionRequest) (*ValidateSessionResponse, error)
	RefreshSession(ctx context.Context, req RefreshSessionRequest) (*RefreshSessionResponse, error)
	Logout(ctx context.Context, req LogoutRequest) (*LogoutResponse, error)
	ForgotPassword(ctx context.Context, req ForgotPasswordRequest) (*ForgotPasswordResponse, error)
	ResetPassword(ctx context.Context, req ResetPasswordRequest) (*ResetPasswordResponse, error)
	GetUser(ctx context.Context, req GetUserRequest) (*GetUserResponse, error)
	GetUserByEmail(ctx context.Context, req GetUserByEmailRequest) (*GetUserByEmailResponse, error)
	DeleteUser(ctx context.Context, req DeleteUserRequest) (*DeleteUserResponse, error)
}

// Compile-time check to ensure AuthService implements IAuthService
var _ IAuthService = (*AuthService)(nil)

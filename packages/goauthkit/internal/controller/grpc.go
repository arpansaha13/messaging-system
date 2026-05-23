package controller

import (
	"context"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/service"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/utils"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/pb"
)

// AuthServiceImpl implements the gRPC AuthService
type AuthServiceImpl struct {
	pb.UnimplementedAuthServiceServer
	authService service.IAuthService
	validator   *utils.Validator
}

// NewAuthServiceImpl creates a new auth service implementation
func NewAuthServiceImpl(authService service.IAuthService, validator *utils.Validator) *AuthServiceImpl {
	return &AuthServiceImpl{
		authService: authService,
		validator:   validator,
	}
}

// ValidateSession validates a session token
func (s *AuthServiceImpl) ValidateSession(ctx context.Context, req *pb.ValidateSessionRequest) (*pb.ValidateSessionResponse, error) {
	// Extract token from metadata
	token := extractToken(ctx)
	if token == "" {
		return nil, status.Error(codes.Unauthenticated, "missing authorization token")
	}

	// Call service
	serviceReq := service.ValidateSessionRequest{
		Token: token,
	}

	resp, err := s.authService.ValidateSession(ctx, serviceReq)
	if err != nil {
		gtk.LoggerFromContext(ctx).Error("validate session error", zap.Error(err))
		return nil, err
	}

	return &pb.ValidateSessionResponse{
		UserId: resp.UserID,
		Valid:  resp.Valid,
	}, nil
}

// RefreshSession extends a valid session
func (s *AuthServiceImpl) RefreshSession(ctx context.Context, req *pb.RefreshSessionRequest) (*pb.RefreshSessionResponse, error) {
	// Extract token from metadata
	token := extractToken(ctx)
	if token == "" {
		return nil, status.Error(codes.Unauthenticated, "missing authorization token")
	}

	// Call service
	serviceReq := service.RefreshSessionRequest{
		Token: token,
	}

	resp, err := s.authService.RefreshSession(ctx, serviceReq)
	if err != nil {
		gtk.LoggerFromContext(ctx).Error("refresh session error", zap.Error(err))
		return nil, err
	}

	return &pb.RefreshSessionResponse{
		NewSessionToken: resp.NewSessionToken,
	}, nil
}

// ForgotPassword initiates password reset by sending OTP to email
func (s *AuthServiceImpl) ForgotPassword(ctx context.Context, req *pb.ForgotPasswordRequest) (*pb.ForgotPasswordResponse, error) {
	// Validate request
	if err := s.validateForgotPasswordRequest(req); err != nil {
		gtk.LoggerFromContext(ctx).Warn("forgot password validation error", zap.Error(err))
		return nil, err
	}

	// Call service
	serviceReq := service.ForgotPasswordRequest{
		Email: req.Email,
	}

	resp, err := s.authService.ForgotPassword(ctx, serviceReq)
	if err != nil {
		gtk.LoggerFromContext(ctx).Error("forgot password error", zap.Error(err))
		return nil, err
	}

	return &pb.ForgotPasswordResponse{
		Message: resp.Message,
		OtpHash: resp.OTPHash,
	}, nil
}

// ResetPassword verifies OTP and resets user's password
func (s *AuthServiceImpl) ResetPassword(ctx context.Context, req *pb.ResetPasswordRequest) (*pb.ResetPasswordResponse, error) {
	// Validate request
	if err := s.validateResetPasswordRequest(req); err != nil {
		gtk.LoggerFromContext(ctx).Warn("reset password validation error", zap.Error(err))
		return nil, err
	}

	serviceReq := service.ResetPasswordRequest{
		OTPHash:  req.OtpHash,
		Code:     req.Code,
		Password: req.Password,
	}

	resp, err := s.authService.ResetPassword(ctx, serviceReq)
	if err != nil {
		gtk.LoggerFromContext(ctx).Error("reset password error", zap.Error(err))
		return nil, err
	}

	return &pb.ResetPasswordResponse{
		Message: resp.Message,
	}, nil
}

// Private helper and validation methods

func (s *AuthServiceImpl) validateForgotPasswordRequest(req *pb.ForgotPasswordRequest) error {
	if req.Email == "" {
		return &gtk.ValidationError{Message: "email is required", Field: "email"}
	}
	if err := s.validator.ValidateEmail(req.Email); err != nil {
		return &gtk.ValidationError{Message: err.Error(), Field: "email"}
	}
	return nil
}

func (s *AuthServiceImpl) validateResetPasswordRequest(req *pb.ResetPasswordRequest) error {
	if req.OtpHash == "" {
		return &gtk.ValidationError{Message: "otp_hash is required", Field: "otp_hash"}
	}
	if req.Code == "" {
		return &gtk.ValidationError{Message: "code is required", Field: "code"}
	}
	if req.Password == "" {
		return &gtk.ValidationError{Message: "password is required", Field: "password"}
	}
	if err := s.validator.ValidateOTPCode(req.Code, 6); err != nil {
		return &gtk.ValidationError{Message: err.Error(), Field: "code"}
	}
	if err := s.validator.ValidatePassword(req.Password); err != nil {
		return &gtk.ValidationError{Message: err.Error(), Field: "password"}
	}
	return nil
}

func extractToken(ctx context.Context) string {
	// Extract from context metadata
	// This will be populated by the interceptor
	token, ok := ctx.Value("authorization").(string)
	if !ok {
		return ""
	}
	return token
}

// LiveZ is a liveness probe — returns immediately with no side effects.
func (s *AuthServiceImpl) LiveZ(_ context.Context, _ *pb.LiveZRequest) (*pb.LiveZResponse, error) {
	return &pb.LiveZResponse{}, nil
}

package controller

import (
	"context"
	"testing"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/service"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/utils"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/pb"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/tests/mocks"
)

// newTestController creates a new AuthServiceImpl with a real validator for testing
func newTestController(mockService service.IAuthService) *AuthServiceImpl {
	validator := utils.NewValidator()
	return NewAuthServiceImpl(mockService, validator)
}

// TestForgotPasswordValidation tests request validation for ForgotPassword endpoint
func TestForgotPasswordValidation(t *testing.T) {
	type TestCaseData struct {
		Name          string
		Request       *pb.ForgotPasswordRequest
		ExpectedError bool
		ErrorType     error
		MockFunc      func(ctx context.Context, req service.ForgotPasswordRequest) (*service.ForgotPasswordResponse, error)
	}

	testCases := []TestCaseData{
		{
			Name: "Valid forgot password request",
			Request: &pb.ForgotPasswordRequest{
				Email: "user@example.com",
			},
			ExpectedError: false,
			MockFunc: func(ctx context.Context, req service.ForgotPasswordRequest) (*service.ForgotPasswordResponse, error) {
				return &service.ForgotPasswordResponse{
					Message: "if email exists, reset link will be sent",
					OTPHash: "test-hash",
				}, nil
			},
		},
		{
			Name: "Empty email",
			Request: &pb.ForgotPasswordRequest{
				Email: "",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			mockService := &mocks.MockAuthService{
				ForgotPasswordFunc: tc.MockFunc,
			}

			controller := newTestController(mockService)
			resp, err := controller.ForgotPassword(context.Background(), tc.Request)

			if tc.ExpectedError {
				require.Error(t, err)
				assert.IsType(t, tc.ErrorType, err)
				assert.Nil(t, resp)
			} else {
				require.NoError(t, err)
				assert.NotNil(t, resp)
			}
		})
	}
}

// TestResetPasswordValidation tests request validation for ResetPassword endpoint
func TestResetPasswordValidation(t *testing.T) {
	type TestCaseData struct {
		Name          string
		Request       *pb.ResetPasswordRequest
		ExpectedError bool
		ErrorType     error
		MockFunc      func(ctx context.Context, req service.ResetPasswordRequest) (*service.ResetPasswordResponse, error)
	}

	testCases := []TestCaseData{
		{
			Name: "Valid reset password request",
			Request: &pb.ResetPasswordRequest{
				OtpHash:  "test-hash",
				Code:     "123456",
				Password: "newPassword123",
			},
			ExpectedError: false,
			MockFunc: func(ctx context.Context, req service.ResetPasswordRequest) (*service.ResetPasswordResponse, error) {
				return &service.ResetPasswordResponse{
					Message: "password reset successfully",
				}, nil
			},
		},
		{
			Name: "Empty OTP hash",
			Request: &pb.ResetPasswordRequest{
				OtpHash:  "",
				Code:     "123456",
				Password: "newPassword123",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name: "Invalid OTP code format",
			Request: &pb.ResetPasswordRequest{
				OtpHash:  "test-hash",
				Code:     "12345", // Too short
				Password: "newPassword123",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name: "Password too short",
			Request: &pb.ResetPasswordRequest{
				OtpHash:  "test-hash",
				Code:     "123456",
				Password: "short", // Less than 8 characters
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name: "Unauthorized - invalid OTP",
			Request: &pb.ResetPasswordRequest{
				OtpHash:  "invalid-hash",
				Code:     "123456",
				Password: "newPassword123",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.UnauthorizedError)(nil),
			MockFunc: func(ctx context.Context, req service.ResetPasswordRequest) (*service.ResetPasswordResponse, error) {
				return nil, &gtk.UnauthorizedError{Message: "invalid otp code"}
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			mockService := &mocks.MockAuthService{
				ResetPasswordFunc: tc.MockFunc,
			}

			controller := newTestController(mockService)
			resp, err := controller.ResetPassword(context.Background(), tc.Request)

			if tc.ExpectedError {
				require.Error(t, err)
				assert.IsType(t, tc.ErrorType, err)
				assert.Nil(t, resp)
			} else {
				require.NoError(t, err)
				assert.NotNil(t, resp)
			}
		})
	}
}

package controller

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/service"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/utils"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/tests/mocks"
)

// TestSignupValidation tests request validation for Signup endpoint
func TestSignupValidation(t *testing.T) {
	testCases := []struct {
		Name          string
		Body          any
		ExpectedError bool
		ErrorType     error
		MockFunc      func(ctx context.Context, req service.SignupRequest) (*service.SignupResponse, error)
	}{
		{
			Name: "Valid signup request",
			Body: map[string]string{
				"email":           "test@example.com",
				"password":        "securePassword123",
				"globalName":      "Test User",
				"confirmPassword": "securePassword123",
			},
			ExpectedError: false,
			MockFunc: func(ctx context.Context, req service.SignupRequest) (*service.SignupResponse, error) {
				return &service.SignupResponse{Message: "success", OTPHash: "test-hash"}, nil
			},
		},
		{
			Name: "Missing email",
			Body: map[string]string{
				"email":    "",
				"password": "securePassword123",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name: "Missing password",
			Body: map[string]string{
				"email":    "test@example.com",
				"password": "",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name: "Both fields missing",
			Body: map[string]string{
				"email":    "",
				"password": "",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name:          "Invalid JSON body",
			Body:          "{invalid json",
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			mockService := &mocks.MockAuthService{
				SignupFunc: tc.MockFunc,
			}
			controller := NewSignupController(mockService, utils.NewValidator())

			var reqBody io.Reader
			if str, ok := tc.Body.(string); ok {
				reqBody = strings.NewReader(str)
			} else {
				jsonData, _ := json.Marshal(tc.Body)
				reqBody = bytes.NewReader(jsonData)
			}

			req := httptest.NewRequest("POST", "/signup", reqBody)
			w := httptest.NewRecorder()

			resp, err := controller(w, req)

			if tc.ExpectedError {
				require.Error(t, err)
				assert.IsType(t, tc.ErrorType, err)
				assert.Nil(t, resp)
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				assert.Equal(t, http.StatusCreated, resp.StatusCode)
				assert.IsType(t, &service.SignupResponse{}, resp.Body)
			}
		})
	}
}

// TestVerifyOTPValidation tests request validation for VerifyOTP endpoint
func TestVerifyOTPValidation(t *testing.T) {
	testCases := []struct {
		Name          string
		Body          any
		ExpectedError bool
		ErrorType     error
		MockFunc      func(ctx context.Context, req service.VerifyOTPRequest) (*service.VerifyOTPResponse, error)
	}{
		{
			Name: "Valid verify OTP request",
			Body: map[string]string{
				"otpHash": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
				"code":    "123456",
			},
			ExpectedError: false,
			MockFunc: func(ctx context.Context, req service.VerifyOTPRequest) (*service.VerifyOTPResponse, error) {
				return &service.VerifyOTPResponse{
					Message:      "success",
					Username:     "test_user",
					SessionToken: "token",
					OTPHash:      req.OTPHash,
				}, nil
			},
		},
		{
			Name: "Missing OTP hash",
			Body: map[string]string{
				"otpHash": "",
				"code":     "123456",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name: "Missing OTP code",
			Body: map[string]string{
				"otpHash": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
				"code":    "",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name: "Invalid OTP hash length",
			Body: map[string]string{
				"otpHash": "invalid-length",
				"code":     "123456",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name:          "Invalid JSON body",
			Body:          "{invalid json",
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			mockService := &mocks.MockAuthService{
				VerifyOTPFunc: tc.MockFunc,
			}
			controller := NewVerifyOTPController(mockService, utils.NewValidator(), CookieConfig{Name: "session"})

			var reqBody io.Reader
			if str, ok := tc.Body.(string); ok {
				reqBody = strings.NewReader(str)
			} else {
				jsonData, _ := json.Marshal(tc.Body)
				reqBody = bytes.NewReader(jsonData)
			}

			req := httptest.NewRequest("POST", "/verify", reqBody)
			w := httptest.NewRecorder()

			resp, err := controller(w, req)

			if tc.ExpectedError {
				require.Error(t, err)
				assert.IsType(t, tc.ErrorType, err)
				assert.Nil(t, resp)
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				assert.Equal(t, http.StatusOK, resp.StatusCode)
				assert.IsType(t, &service.VerifyOTPResponse{}, resp.Body)
			}
		})
	}
}

// TestLoginValidation tests request validation for Login endpoint
func TestLoginValidation(t *testing.T) {
	testCases := []struct {
		Name          string
		Body          any
		ExpectedError bool
		ErrorType     error
		MockFunc      func(ctx context.Context, req service.LoginRequest) (*service.LoginResponse, error)
	}{
		{
			Name: "Valid login request",
			Body: map[string]string{
				"email":    "test@example.com",
				"password": "securePassword123",
			},
			ExpectedError: false,
			MockFunc: func(ctx context.Context, req service.LoginRequest) (*service.LoginResponse, error) {
				return &service.LoginResponse{SessionToken: "token"}, nil
			},
		},
		{
			Name: "Missing email",
			Body: map[string]string{
				"email":    "",
				"password": "securePassword123",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name: "Missing password",
			Body: map[string]string{
				"email":    "test@example.com",
				"password": "",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name: "Both fields missing",
			Body: map[string]string{
				"email":    "",
				"password": "",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name:          "Invalid JSON body",
			Body:          "{invalid json",
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			mockService := &mocks.MockAuthService{
				LoginFunc: tc.MockFunc,
			}
			controller := NewLoginController(mockService, utils.NewValidator(), CookieConfig{Name: "session"})

			var reqBody io.Reader
			if str, ok := tc.Body.(string); ok {
				reqBody = strings.NewReader(str)
			} else {
				jsonData, _ := json.Marshal(tc.Body)
				reqBody = bytes.NewReader(jsonData)
			}

			req := httptest.NewRequest("POST", "/login", reqBody)
			w := httptest.NewRecorder()

			resp, err := controller(w, req)

			if tc.ExpectedError {
				require.Error(t, err)
				assert.IsType(t, tc.ErrorType, err)
				assert.Nil(t, resp)
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				assert.Equal(t, http.StatusOK, resp.StatusCode)
				assert.IsType(t, &service.LoginResponse{}, resp.Body)
			}
		})
	}
}

// TestSignupErrorHandling tests error handling for Signup endpoint
func TestSignupErrorHandling(t *testing.T) {
	testCases := []struct {
		Name          string
		Body          any
		ExpectedError bool
		ErrorType     error
		MockFunc      func(ctx context.Context, req service.SignupRequest) (*service.SignupResponse, error)
	}{
		{
			Name: "Service returns conflict error",
			Body: map[string]string{
				"email":           "test@example.com",
				"password":        "securePassword123",
				"globalName":      "Test User",
				"confirmPassword": "securePassword123",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ConflictError)(nil),
			MockFunc: func(ctx context.Context, req service.SignupRequest) (*service.SignupResponse, error) {
				return nil, &gtk.ConflictError{Message: "email already registered"}
			},
		},
		{
			Name: "Service returns validation error",
			Body: map[string]string{
				"email":           "test@example.com",
				"password":        "securePassword123",
				"globalName":      "Test User",
				"confirmPassword": "securePassword123",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
			MockFunc: func(ctx context.Context, req service.SignupRequest) (*service.SignupResponse, error) {
				return nil, &gtk.ValidationError{Message: "invalid email format", Field: "email"}
			},
		},
		{
			Name: "Service returns internal error",
			Body: map[string]string{
				"email":           "test@example.com",
				"password":        "securePassword123",
				"globalName":      "Test User",
				"confirmPassword": "securePassword123",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.InternalError)(nil),
			MockFunc: func(ctx context.Context, req service.SignupRequest) (*service.SignupResponse, error) {
				return nil, &gtk.InternalError{Message: "database error"}
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			mockService := &mocks.MockAuthService{
				SignupFunc: tc.MockFunc,
			}

			controller := NewSignupController(mockService, utils.NewValidator())

			var reqBody io.Reader
			if str, ok := tc.Body.(string); ok {
				reqBody = strings.NewReader(str)
			} else {
				jsonData, _ := json.Marshal(tc.Body)
				reqBody = bytes.NewReader(jsonData)
			}

			req := httptest.NewRequest("POST", "/signup", reqBody)
			w := httptest.NewRecorder()

			resp, err := controller(w, req)

			require.Error(t, err)
			assert.IsType(t, tc.ErrorType, err)
			assert.Nil(t, resp)
		})
	}
}

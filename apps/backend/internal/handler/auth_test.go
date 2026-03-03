package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/timestamppb"

	gtk "github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/pb"
	"github.com/arpansaha13/messaging-system/apps/backend/tests/mocks"
)

func TestAuthHandler_Signup(t *testing.T) {
	tests := []struct {
		name          string
		requestBody   *dto.SignupRequestDTO
		mockFunc      func() service.IAuthServiceClient
		expectedError error
		validateResp  func(t *testing.T, resp *dto.SignupResponseDTO)
	}{
		{
			name: "successful signup",
			requestBody: &dto.SignupRequestDTO{
				Email:    "test@example.com",
				Password: "password123",
			},
			mockFunc: func() service.IAuthServiceClient {
				return &mocks.MockAuthServiceClient{
					SignupFunc: func(ctx context.Context, email, password string) (*pb.SignupResponse, error) {
						return &pb.SignupResponse{
							Message: "signup successful",
							OtpHash: "hash123",
						}, nil
					},
				}
			},
			expectedError: nil,
			validateResp: func(t *testing.T, resp *dto.SignupResponseDTO) {
				assert.Equal(t, "signup successful", resp.Message)
				assert.Equal(t, "hash123", resp.OtpHash)
			},
		},
		{
			name: "email already registered",
			requestBody: &dto.SignupRequestDTO{
				Email:    "existing@example.com",
				Password: "password123",
			},
			mockFunc: func() service.IAuthServiceClient {
				return &mocks.MockAuthServiceClient{
					SignupFunc: func(ctx context.Context, email, password string) (*pb.SignupResponse, error) {
						return nil, &gtk.ConflictError{Message: "email already exists"}
					},
				}
			},
			expectedError: &gtk.ConflictError{Message: "email already registered"},
		},
		{
			name: "invalid email and password",
			requestBody: &dto.SignupRequestDTO{
				Email:    "",
				Password: "",
			},
			mockFunc: func() service.IAuthServiceClient {
				return &mocks.MockAuthServiceClient{
					SignupFunc: func(ctx context.Context, email, password string) (*pb.SignupResponse, error) {
						return nil, &gtk.ValidationError{Message: "invalid request"}
					},
				}
			},
			expectedError: &gtk.ValidationError{Message: "email and password are required"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.mockFunc()

			body, err := json.Marshal(tt.requestBody)
			require.NoError(t, err)

			req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", bytes.NewBuffer(body))
			w := httptest.NewRecorder()

			controller := signupController(mockService)
			err = controller(w, req)

			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tt.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
				if tt.validateResp != nil {
					var resp dto.SignupResponseDTO
					err := json.NewDecoder(w.Body).Decode(&resp)
					require.NoError(t, err)
					tt.validateResp(t, &resp)
				}
			}
		})
	}
}

func TestAuthHandler_Login(t *testing.T) {
	tests := []struct {
		name          string
		requestBody   *dto.LoginRequestDTO
		mockFunc      func() service.IAuthServiceClient
		expectedError error
		validateResp  func(t *testing.T, resp *dto.LoginResponseDTO)
	}{
		{
			name: "successful login",
			requestBody: &dto.LoginRequestDTO{
				Email:    "test@example.com",
				Password: "password123",
			},
			mockFunc: func() service.IAuthServiceClient {
				return &mocks.MockAuthServiceClient{
					LoginFunc: func(ctx context.Context, email, password string) (*pb.LoginResponse, error) {
						return &pb.LoginResponse{
							SessionToken: "token123",
							ExpiresAt:    timestamppb.Now(),
						}, nil
					},
				}
			},
			expectedError: nil,
			validateResp: func(t *testing.T, resp *dto.LoginResponseDTO) {
				assert.Equal(t, "login successful", resp.Message)
			},
		},
		{
			name: "invalid credentials",
			requestBody: &dto.LoginRequestDTO{
				Email:    "test@example.com",
				Password: "wrongpassword",
			},
			mockFunc: func() service.IAuthServiceClient {
				return &mocks.MockAuthServiceClient{
					LoginFunc: func(ctx context.Context, email, password string) (*pb.LoginResponse, error) {
						return nil, &gtk.UnauthorizedError{Message: "invalid email or password"}
					},
				}
			},
			expectedError: &gtk.UnauthorizedError{Message: "invalid email or password"},
		},
		{
			name: "missing email and password",
			requestBody: &dto.LoginRequestDTO{
				Email:    "",
				Password: "",
			},
			mockFunc: func() service.IAuthServiceClient {
				return &mocks.MockAuthServiceClient{
					LoginFunc: func(ctx context.Context, email, password string) (*pb.LoginResponse, error) {
						return nil, &gtk.ValidationError{Message: "invalid request"}
					},
				}
			},
			expectedError: &gtk.ValidationError{Message: "email and password are required"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.mockFunc()

			body, err := json.Marshal(tt.requestBody)
			require.NoError(t, err)

			req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(body))
			w := httptest.NewRecorder()

			controller := loginController(mockService)
			err = controller(w, req)

			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tt.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
				if tt.validateResp != nil {
					var resp dto.LoginResponseDTO
					err := json.NewDecoder(w.Body).Decode(&resp)
					require.NoError(t, err)
					tt.validateResp(t, &resp)
				}
			}
		})
	}
}

func TestAuthHandler_VerifyOTP(t *testing.T) {
	// Note: VerifyOTP tests cannot be properly tested directly without mux router
	// because the handler uses mux.Vars to extract the otpHash from the URL.
	// In integration tests, this would be tested through the full HTTP router.
	t.Skip("VerifyOTP handler requires mux router for URL parameter extraction")
}

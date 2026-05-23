package service_test

import (
	"context"
	"log"
	"sync"
	"testing"
	"time"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/service"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/utils"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/worker"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/tests/mocks"
)

// MockEmailProvider is a test implementation of EmailProvider
type MockEmailProvider struct {
	mu    sync.Mutex
	calls int
}

func (m *MockEmailProvider) SendEmail(ctx context.Context, email, subject, body string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.calls++
	log.Printf("MockEmailProvider: sent email to %s with subject: %s", email, subject)
	return nil
}

func TestAuthService_Signup(t *testing.T) {
	tests := []struct {
		name             string
		email            string
		password         string
		mockUserRepo     func() *mocks.MockUserRepository
		mockOTPRepo      func() *mocks.MockOTPRepository
		mockSessionRepo  func() *mocks.MockSessionRepository
		expectedError    bool
		validateResponse func(t *testing.T, resp *service.SignupResponse)
	}{
		{
			name:     "successful signup",
			email:    "test@example.com",
			password: "SecurePass123",
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					ExistsEmailFunc: func(ctx context.Context, email string) (bool, error) {
						return false, nil
					},
					CreateFunc: func(ctx context.Context, user *domain.User, credentials *domain.Credentials) error {
						user.ID = 1
						return nil
					},
				}
			},
			mockOTPRepo: func() *mocks.MockOTPRepository {
				return &mocks.MockOTPRepository{
					CreateFunc: func(ctx context.Context, otp *domain.OTP) error {
						return nil
					},
				}
			},
			mockSessionRepo: func() *mocks.MockSessionRepository {
				return &mocks.MockSessionRepository{}
			},
			expectedError: false,
			validateResponse: func(t *testing.T, resp *service.SignupResponse) {
				assert.NotEmpty(t, resp.Message)
				assert.NotEmpty(t, resp.OTPHash)
			},
		},
		{
			name:     "email already exists",
			email:    "existing@example.com",
			password: "SecurePass123",
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					ExistsEmailFunc: func(ctx context.Context, email string) (bool, error) {
						return true, nil
					},
				}
			},
			mockOTPRepo: func() *mocks.MockOTPRepository {
				return &mocks.MockOTPRepository{}
			},
			mockSessionRepo: func() *mocks.MockSessionRepository {
				return &mocks.MockSessionRepository{}
			},
			expectedError: true,
		},
	}

	hasher := utils.NewPasswordHasher()
	emailProvider := &MockEmailProvider{}
	emailPool := worker.NewEmailWorkerPool(2, 100, emailProvider)
	defer emailPool.Stop()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userRepo := tt.mockUserRepo()
			otpRepo := tt.mockOTPRepo()
			sessionRepo := tt.mockSessionRepo()

			config := service.AuthServiceConfig{
				OTPExpiry:  time.Minute * 10,
				OTPLength:  6,
				SessionTTL: time.Hour * 24,
				SecretKey:  "secret",
				EmailPool:  emailPool,
			}
			svc := service.NewAuthService(userRepo, otpRepo, sessionRepo, &mocks.MockProviderRepository{}, &mocks.MockSessionCache{}, hasher, config, nil)
			resp, err := svc.Signup(context.Background(), service.SignupRequest{Email: tt.email, Password: tt.password})

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResponse(t, resp)
			}
		})
	}
}

func TestAuthService_Login(t *testing.T) {
	tests := []struct {
		name             string
		email            string
		password         string
		mockUserRepo     func() *mocks.MockUserRepository
		mockOTPRepo      func() *mocks.MockOTPRepository
		mockSessionRepo  func() *mocks.MockSessionRepository
		expectedError    bool
		validateResponse func(t *testing.T, resp *service.LoginResponse)
	}{
		{
			name:     "successful login",
			email:    "test@example.com",
			password: "SecurePass123",
			mockUserRepo: func() *mocks.MockUserRepository {
				hasher := utils.NewPasswordHasher()
				hashedPassword, _ := hasher.Hash("SecurePass123")
				creds := &domain.Credentials{PasswordHash: hashedPassword}
				return &mocks.MockUserRepository{
					GetByEmailFunc: func(ctx context.Context, email string) (*domain.User, error) {
						return &domain.User{
							ID:          1,
							Email:       email,
							Verified:    true,
							Credentials: creds,
						}, nil
					},
					UpdateLastLoginFunc: func(ctx context.Context, userID int64) error {
						return nil
					},
				}
			},
			mockOTPRepo: func() *mocks.MockOTPRepository {
				return &mocks.MockOTPRepository{}
			},
			mockSessionRepo: func() *mocks.MockSessionRepository {
				return &mocks.MockSessionRepository{
					CreateFunc: func(ctx context.Context, session *domain.Session) error {
						return nil
					},
				}
			},
			expectedError: false,
			validateResponse: func(t *testing.T, resp *service.LoginResponse) {
				assert.NotEmpty(t, resp.SessionToken)
				assert.False(t, resp.ExpiresAt.IsZero())
			},
		},
		{
			name:     "user not found",
			email:    "notfound@example.com",
			password: "SecurePass123",
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByEmailFunc: func(ctx context.Context, email string) (*domain.User, error) {
						return nil, &gtk.NotFoundError{Message: "user not found"}
					},
				}
			},
			mockOTPRepo: func() *mocks.MockOTPRepository {
				return &mocks.MockOTPRepository{}
			},
			mockSessionRepo: func() *mocks.MockSessionRepository {
				return &mocks.MockSessionRepository{}
			},
			expectedError: true,
		},
	}

	hasher := utils.NewPasswordHasher()
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userRepo := tt.mockUserRepo()
			otpRepo := tt.mockOTPRepo()
			sessionRepo := tt.mockSessionRepo()

			config := service.AuthServiceConfig{
				OTPExpiry:  time.Minute * 10,
				OTPLength:  6,
				SessionTTL: time.Hour * 24,
				SecretKey:  "secret",
			}
			svc := service.NewAuthService(userRepo, otpRepo, sessionRepo, &mocks.MockProviderRepository{}, &mocks.MockSessionCache{}, hasher, config, nil)
			resp, err := svc.Login(context.Background(), service.LoginRequest{Email: tt.email, Password: tt.password})

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResponse(t, resp)
			}
		})
	}
}

func TestAuthService_ValidateSession(t *testing.T) {
	tests := []struct {
		name             string
		token            string
		mockUserRepo     func() *mocks.MockUserRepository
		mockOTPRepo      func() *mocks.MockOTPRepository
		mockSessionRepo  func() *mocks.MockSessionRepository
		expectedError    bool
		validateResponse func(t *testing.T, resp *service.ValidateSessionResponse)
	}{
		{
			name:  "valid session token",
			token: "valid_token_123",
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{}
			},
			mockOTPRepo: func() *mocks.MockOTPRepository {
				return &mocks.MockOTPRepository{}
			},
			mockSessionRepo: func() *mocks.MockSessionRepository {
				return &mocks.MockSessionRepository{
					IsTokenValidFunc: func(ctx context.Context, tokenHash string) (bool, int64, error) {
						return true, 1, nil
					},
				}
			},
			expectedError: false,
			validateResponse: func(t *testing.T, resp *service.ValidateSessionResponse) {
				assert.Equal(t, int64(1), resp.UserID)
				assert.True(t, resp.Valid)
			},
		},
		{
			name:  "invalid session token",
			token: "invalid_token",
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{}
			},
			mockOTPRepo: func() *mocks.MockOTPRepository {
				return &mocks.MockOTPRepository{}
			},
			mockSessionRepo: func() *mocks.MockSessionRepository {
				return &mocks.MockSessionRepository{
					IsTokenValidFunc: func(ctx context.Context, tokenHash string) (bool, int64, error) {
						return false, 0, nil
					},
				}
			},
			expectedError: false,
			validateResponse: func(t *testing.T, resp *service.ValidateSessionResponse) {
				assert.Equal(t, int64(0), resp.UserID)
				assert.False(t, resp.Valid)
			},
		},
	}

	hasher := utils.NewPasswordHasher()
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userRepo := tt.mockUserRepo()
			otpRepo := tt.mockOTPRepo()
			sessionRepo := tt.mockSessionRepo()

			config := service.AuthServiceConfig{
				OTPExpiry:  time.Minute * 10,
				OTPLength:  6,
				SessionTTL: time.Hour * 24,
				SecretKey:  "secret",
			}
			svc := service.NewAuthService(userRepo, otpRepo, sessionRepo, &mocks.MockProviderRepository{}, &mocks.MockSessionCache{}, hasher, config, nil)
			resp, err := svc.ValidateSession(context.Background(), service.ValidateSessionRequest{Token: tt.token})

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResponse(t, resp)
			}
		})
	}
}

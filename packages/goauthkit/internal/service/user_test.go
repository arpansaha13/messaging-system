package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/service"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/utils"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/tests/mocks"
)

func TestAuthService_GetUser(t *testing.T) {
	tests := []struct {
		name             string
		userID           int64
		mockUserRepo     func() *mocks.MockUserRepository
		mockOTPRepo      func() *mocks.MockOTPRepository
		mockSessionRepo  func() *mocks.MockSessionRepository
		expectedError    bool
		validateResponse func(t *testing.T, resp *service.GetUserResponse)
	}{
		{
			name:   "successful get user",
			userID: 1,
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.User, error) {
						username := "testuser"
						return &domain.User{
							ID:        1,
							Email:     "test@example.com",
							Username:  &username,
							Verified:  true,
							CreatedAt: time.Now(),
						}, nil
					},
				}
			},
			mockOTPRepo: func() *mocks.MockOTPRepository {
				return &mocks.MockOTPRepository{}
			},
			mockSessionRepo: func() *mocks.MockSessionRepository {
				return &mocks.MockSessionRepository{}
			},
			expectedError: false,
			validateResponse: func(t *testing.T, resp *service.GetUserResponse) {
				assert.Equal(t, int64(1), resp.User.UserID)
				assert.Equal(t, "test@example.com", resp.User.Email)
				assert.Equal(t, "testuser", resp.User.Username)
				assert.True(t, resp.User.Verified)
			},
		},
		{
			name:   "user not found",
			userID: 999,
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.User, error) {
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
			resp, err := svc.GetUser(context.Background(), service.GetUserRequest{UserID: tt.userID})

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResponse(t, resp)
			}
		})
	}
}

func TestAuthService_GetUserByEmail(t *testing.T) {
	tests := []struct {
		name             string
		email            string
		mockUserRepo     func() *mocks.MockUserRepository
		mockOTPRepo      func() *mocks.MockOTPRepository
		mockSessionRepo  func() *mocks.MockSessionRepository
		expectedError    bool
		validateResponse func(t *testing.T, resp *service.GetUserByEmailResponse)
	}{
		{
			name:  "successful get user by email",
			email: "test@example.com",
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByEmailFunc: func(ctx context.Context, email string) (*domain.User, error) {
						username := "testuser"
						return &domain.User{
							ID:        1,
							Email:     email,
							Username:  &username,
							Verified:  true,
							CreatedAt: time.Now(),
						}, nil
					},
				}
			},
			mockOTPRepo: func() *mocks.MockOTPRepository {
				return &mocks.MockOTPRepository{}
			},
			mockSessionRepo: func() *mocks.MockSessionRepository {
				return &mocks.MockSessionRepository{}
			},
			expectedError: false,
			validateResponse: func(t *testing.T, resp *service.GetUserByEmailResponse) {
				assert.Equal(t, int64(1), resp.User.UserID)
				assert.Equal(t, "test@example.com", resp.User.Email)
				assert.Equal(t, "testuser", resp.User.Username)
				assert.True(t, resp.User.Verified)
			},
		},
		{
			name:  "user email not found",
			email: "notfound@example.com",
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
			resp, err := svc.GetUserByEmail(context.Background(), service.GetUserByEmailRequest{Email: tt.email})

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResponse(t, resp)
			}
		})
	}
}

func TestAuthService_DeleteUser(t *testing.T) {
	tests := []struct {
		name             string
		userID           int64
		mockUserRepo     func() *mocks.MockUserRepository
		mockOTPRepo      func() *mocks.MockOTPRepository
		mockSessionRepo  func() *mocks.MockSessionRepository
		expectedError    bool
		validateResponse func(t *testing.T, resp *service.DeleteUserResponse)
	}{
		{
			name:   "successful delete user",
			userID: 1,
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.User, error) {
						username := "testuser"
						return &domain.User{
							ID:        1,
							Email:     "test@example.com",
							Username:  &username,
							Verified:  true,
							CreatedAt: time.Now(),
						}, nil
					},
					DeleteFunc: func(ctx context.Context, id int64) error {
						return nil
					},
				}
			},
			mockOTPRepo: func() *mocks.MockOTPRepository {
				return &mocks.MockOTPRepository{}
			},
			mockSessionRepo: func() *mocks.MockSessionRepository {
				return &mocks.MockSessionRepository{}
			},
			expectedError: false,
			validateResponse: func(t *testing.T, resp *service.DeleteUserResponse) {
				assert.NotEmpty(t, resp.Message)
				assert.Contains(t, resp.Message, "deleted")
			},
		},
		{
			name:   "user not found for deletion",
			userID: 999,
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.User, error) {
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
			resp, err := svc.DeleteUser(context.Background(), service.DeleteUserRequest{UserID: tt.userID})

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResponse(t, resp)
			}
		})
	}
}

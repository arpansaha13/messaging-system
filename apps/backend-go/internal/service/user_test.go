package service_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend-go/tests/mocks"
)

func TestUserServiceGetUserProfile(t *testing.T) {
	tests := []struct {
		name          string
		userID        int64
		mockFunc      func() *mocks.MockUserRepository
		expectedError bool
		validateResp  func(t *testing.T, profile *domain.UserProfile)
	}{
		{
			name:   "successful get user profile",
			userID: 1,
			mockFunc: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.UserProfile, error) {
						return &domain.UserProfile{
							ID:         id,
							GlobalName: "Test User",
							Bio:        "Hello world",
							DP:         nil,
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, profile *domain.UserProfile) {
				assert.Equal(t, int64(1), profile.ID)
				assert.Equal(t, "Test User", profile.GlobalName)
				assert.Equal(t, "Hello world", profile.Bio)
			},
		},
		{
			name:   "user not found",
			userID: 999,
			mockFunc: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.UserProfile, error) {
						return nil, &domain.NotFoundError{Message: "user not found"}
					},
				}
			},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			mockContactRepo := &mocks.MockContactRepository{}
			svc := service.NewUserService(mockRepo, mockContactRepo)

			profile, err := svc.GetUserProfile(context.Background(), tt.userID)

			if tt.expectedError {
				assert.Error(t, err)
				assert.Nil(t, profile)
			} else {
				require.NoError(t, err)
				require.NotNil(t, profile)
				tt.validateResp(t, profile)
			}
		})
	}
}

func TestUserServiceSearchUserProfiles(t *testing.T) {
	tests := []struct {
		name          string
		query         string
		mockFunc      func() *mocks.MockUserRepository
		expectedError bool
		validateResp  func(t *testing.T, profiles []*domain.UserProfile)
	}{
		{
			name:  "successful search",
			query: "test",
			mockFunc: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					SearchFunc: func(ctx context.Context, query string, limit int) ([]*domain.UserProfile, error) {
						return []*domain.UserProfile{
							{ID: 1, GlobalName: "Test User", Bio: "Hello"},
							{ID: 2, GlobalName: "Test Admin", Bio: "Admin"},
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, profiles []*domain.UserProfile) {
				assert.Len(t, profiles, 2)
				assert.Equal(t, "Test User", profiles[0].GlobalName)
				assert.Equal(t, "Test Admin", profiles[1].GlobalName)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			mockContactRepo := &mocks.MockContactRepository{}
			svc := service.NewUserService(mockRepo, mockContactRepo)

			profiles, err := svc.SearchUserProfiles(context.Background(), tt.query)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, profiles)
			}
		})
	}
}

func TestUserServiceUpdateUserProfile(t *testing.T) {
	tests := []struct {
		name          string
		userID        int64
		globalName    *string
		bio           *string
		dp            *string
		mockFunc      func() *mocks.MockUserRepository
		expectedError bool
	}{
		{
			name:       "successful update user profile",
			userID:     1,
			globalName: &[]string{"Updated User"}[0],
			bio:        &[]string{"Updated bio"}[0],
			dp:         nil,
			mockFunc: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.UserProfile, error) {
						return &domain.UserProfile{
							ID:         id,
							GlobalName: "Original User",
							Bio:        "Original bio",
							DP:         nil,
						}, nil
					},
					UpdateFunc: func(ctx context.Context, profile *domain.UserProfile) error {
						return nil
					},
				}
			},
			expectedError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			mockContactRepo := &mocks.MockContactRepository{}
			svc := service.NewUserService(mockRepo, mockContactRepo)

			_, err := svc.UpdateUserProfile(context.Background(), tt.userID, tt.globalName, tt.bio, tt.dp)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
			}
		})
	}
}

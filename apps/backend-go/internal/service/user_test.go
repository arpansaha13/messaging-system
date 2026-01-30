package service

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository/mocks"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/utils"
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
			svc := NewUserService(mockRepo, mockContactRepo)

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
		{
			name:  "no results",
			query: "nonexistent",
			mockFunc: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					SearchFunc: func(ctx context.Context, query string, limit int) ([]*domain.UserProfile, error) {
						return []*domain.UserProfile{}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, profiles []*domain.UserProfile) {
				assert.Len(t, profiles, 0)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			mockContactRepo := &mocks.MockContactRepository{}
			svc := NewUserService(mockRepo, mockContactRepo)

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
		validateResp  func(t *testing.T, profile *domain.UserProfile)
	}{
		{
			name:       "successful update all fields",
			userID:     1,
			globalName: utils.Ptr("New Name"),
			bio:        utils.Ptr("New Bio"),
			dp:         utils.Ptr("https://example.com/avatar.jpg"),
			mockFunc: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.UserProfile, error) {
						return &domain.UserProfile{
							ID:         id,
							GlobalName: "Old Name",
							Bio:        "Old Bio",
							DP:         nil,
						}, nil
					},
					UpdateFunc: func(ctx context.Context, user *domain.UserProfile) error {
						return nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, profile *domain.UserProfile) {
				assert.Equal(t, "New Name", profile.GlobalName)
				assert.Equal(t, "New Bio", profile.Bio)
				assert.NotNil(t, profile.DP)
				assert.Equal(t, "https://example.com/avatar.jpg", *profile.DP)
			},
		},
		{
			name:       "partial update only name",
			userID:     1,
			globalName: utils.Ptr("Updated Name"),
			bio:        nil,
			dp:         nil,
			mockFunc: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.UserProfile, error) {
						return &domain.UserProfile{
							ID:         id,
							GlobalName: "Old Name",
							Bio:        "Existing Bio",
							DP:         nil,
						}, nil
					},
					UpdateFunc: func(ctx context.Context, user *domain.UserProfile) error {
						return nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, profile *domain.UserProfile) {
				assert.Equal(t, "Updated Name", profile.GlobalName)
				assert.Equal(t, "Existing Bio", profile.Bio)
			},
		},
		{
			name:       "user not found on get",
			userID:     999,
			globalName: utils.Ptr("New Name"),
			mockFunc: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.UserProfile, error) {
						return nil, &domain.NotFoundError{Message: "user not found"}
					},
				}
			},
			expectedError: true,
		},
		{
			name:       "update fails",
			userID:     1,
			globalName: utils.Ptr("New Name"),
			mockFunc: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.UserProfile, error) {
						return &domain.UserProfile{
							ID:         id,
							GlobalName: "Old Name",
							Bio:        "Bio",
							DP:         nil,
						}, nil
					},
					UpdateFunc: func(ctx context.Context, user *domain.UserProfile) error {
						return &domain.InternalError{Message: "database error"}
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
			svc := NewUserService(mockRepo, mockContactRepo)

			profile, err := svc.UpdateUserProfile(context.Background(), tt.userID, tt.globalName, tt.bio, tt.dp)

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

func TestUserServiceGetUserProfileWithContact(t *testing.T) {
	tests := []struct {
		name            string
		authUserID      int64
		userID          int64
		mockRepoFunc    func() *mocks.MockUserRepository
		mockContactFunc func() *mocks.MockContactRepository
		expectedError   bool
		validateResp    func(t *testing.T, profile *domain.UserProfile, contact *domain.Contact)
	}{
		{
			name:       "successful get with contact info",
			authUserID: 1,
			userID:     2,
			mockRepoFunc: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.UserProfile, error) {
						return &domain.UserProfile{
							ID:         id,
							GlobalName: "Other User",
							Bio:        "Hello",
							DP:         nil,
						}, nil
					},
				}
			},
			mockContactFunc: func() *mocks.MockContactRepository {
				return &mocks.MockContactRepository{
					GetContactByUserIdsFunc: func(ctx context.Context, userID1, userID2 int64) (*domain.Contact, error) {
						return &domain.Contact{
							ID:              1,
							UserID:          userID1,
							UserIDInContact: userID2,
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, profile *domain.UserProfile, contact *domain.Contact) {
				assert.NotNil(t, profile)
				assert.NotNil(t, contact)
				assert.Equal(t, "Other User", profile.GlobalName)
				assert.Equal(t, int64(1), contact.ID)
			},
		},
		{
			name:       "user not found",
			authUserID: 1,
			userID:     999,
			mockRepoFunc: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.UserProfile, error) {
						return nil, &domain.NotFoundError{Message: "user not found"}
					},
				}
			},
			mockContactFunc: func() *mocks.MockContactRepository {
				return &mocks.MockContactRepository{}
			},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockRepoFunc()
			mockContactRepo := tt.mockContactFunc()
			svc := NewUserService(mockRepo, mockContactRepo)

			profile, contact, err := svc.GetUserProfileWithContact(context.Background(), tt.authUserID, tt.userID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, profile, contact)
			}
		})
	}
}

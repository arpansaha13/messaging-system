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

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend-go/tests/mocks"
)

func TestUserHandler_GetUserMe(t *testing.T) {
	tests := []struct {
		name           string
		userID         int64
		mockFunc       func() *mocks.MockUserService
		expectedError  error
		validateResp   func(t *testing.T, resp *dto.AuthUserResponseDTO)
	}{
		{
			name:   "successful get user me",
			userID: 1,
			mockFunc: func() *mocks.MockUserService {
				return &mocks.MockUserService{
					GetUserProfileFunc: func(ctx context.Context, userID int64) (*domain.UserProfile, error) {
						return &domain.UserProfile{
							ID:         userID,
							GlobalName: "Test User",
							Bio:        "Hello world",
						}, nil
					},
				}
			},
			expectedError: nil,
			validateResp: func(t *testing.T, resp *dto.AuthUserResponseDTO) {
				assert.Equal(t, "Test User", resp.GlobalName)
				assert.Equal(t, "Hello world", resp.Bio)
			},
		},
		{
			name:   "user not found",
			userID: 999,
			mockFunc: func() *mocks.MockUserService {
				return &mocks.MockUserService{
					GetUserProfileFunc: func(ctx context.Context, userID int64) (*domain.UserProfile, error) {
						return nil, &domain.NotFoundError{Message: "user not found"}
					},
				}
			},
			expectedError: &domain.NotFoundError{Message: "user not found"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.mockFunc()

			req := httptest.NewRequest(http.MethodGet, "/api/users/me", nil)
			ctx := context.WithValue(req.Context(), middleware.AuthUserContextKey, &domain.AuthUser{
				UserID:   1,
				Email:    "test@example.com",
				Username: "testuser",
				Verified: true,
			})
			req = req.WithContext(ctx)

			w := httptest.NewRecorder()

			controller := getUserMeController(mockService)
			err := controller(w, req)

			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tt.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
				var resp dto.AuthUserResponseDTO
				err := json.NewDecoder(w.Body).Decode(&resp)
				require.NoError(t, err)
				tt.validateResp(t, &resp)
			}
		})
	}
}

func TestUserHandler_SearchUserProfiles(t *testing.T) {
	tests := []struct {
		name          string
		query         string
		mockFunc      func() *mocks.MockUserService
		expectedError error
		validateResp  func(t *testing.T, profiles []dto.UserProfileResponseDTO)
	}{
		{
			name:  "successful search with results",
			query: "test",
			mockFunc: func() *mocks.MockUserService {
				return &mocks.MockUserService{
					SearchUserProfilesFunc: func(ctx context.Context, query string) ([]*domain.UserProfile, error) {
						return []*domain.UserProfile{
							{ID: 1, GlobalName: "test user 1"},
							{ID: 2, GlobalName: "test user 2"},
						}, nil
					},
				}
			},
			expectedError: nil,
			validateResp: func(t *testing.T, profiles []dto.UserProfileResponseDTO) {
				assert.Len(t, profiles, 2)
				assert.Equal(t, "test user 1", profiles[0].GlobalName)
			},
		},
		{
			name:  "empty query returns empty",
			query: "",
			mockFunc: func() *mocks.MockUserService {
				return &mocks.MockUserService{
					SearchUserProfilesFunc: func(ctx context.Context, query string) ([]*domain.UserProfile, error) {
						return []*domain.UserProfile{}, nil
					},
				}
			},
			expectedError: nil,
			validateResp: func(t *testing.T, profiles []dto.UserProfileResponseDTO) {
				assert.Len(t, profiles, 0)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.mockFunc()

			req := httptest.NewRequest(http.MethodGet, "/api/users/search?q="+tt.query, nil)
			w := httptest.NewRecorder()

			controller := searchUserProfilesController(mockService)
			err := controller(w, req)

			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tt.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
				var profiles []dto.UserProfileResponseDTO
				err := json.NewDecoder(w.Body).Decode(&profiles)
				require.NoError(t, err)
				tt.validateResp(t, profiles)
			}
		})
	}
}

func TestUserHandler_UpdateUserMe(t *testing.T) {
	tests := []struct {
		name          string
		userID        int64
		requestBody   *dto.UpdateUserRequestDTO
		mockFunc      func() *mocks.MockUserService
		expectedError error
		validateResp  func(t *testing.T, profile *domain.UserProfile)
	}{
		{
			name:   "successful update all fields",
			userID: 1,
			requestBody: &dto.UpdateUserRequestDTO{
				GlobalName: strPtr("Updated Name"),
				Bio:        strPtr("Updated Bio"),
			},
			mockFunc: func() *mocks.MockUserService {
				return &mocks.MockUserService{
					UpdateUserProfileFunc: func(ctx context.Context, userID int64, globalName, bio, dp *string) (*domain.UserProfile, error) {
						return &domain.UserProfile{
							ID:         userID,
							GlobalName: "Updated Name",
							Bio:        "Updated Bio",
						}, nil
					},
				}
			},
			expectedError: nil,
			validateResp: func(t *testing.T, profile *domain.UserProfile) {
				assert.Equal(t, "Updated Name", profile.GlobalName)
				assert.Equal(t, "Updated Bio", profile.Bio)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.mockFunc()

			body, err := json.Marshal(tt.requestBody)
			require.NoError(t, err)

			req := httptest.NewRequest(http.MethodPut, "/api/users/me", bytes.NewBuffer(body))
			ctx := context.WithValue(req.Context(), middleware.AuthUserContextKey, &domain.AuthUser{
				UserID:   1,
				Email:    "test@example.com",
				Username: "testuser",
				Verified: true,
			})
			req = req.WithContext(ctx)

			w := httptest.NewRecorder()

			controller := updateUserMeController(mockService)
			err = controller(w, req)

			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tt.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
			}
		})
	}
}

// Helper function to create string pointers
func strPtr(s string) *string {
	return &s
}

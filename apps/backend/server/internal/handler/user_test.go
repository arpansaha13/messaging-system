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

	gtk "github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/backend/server/tests/mocks"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

func TestUserHandler_GetUserMe(t *testing.T) {
	tests := []struct {
		name          string
		userID        int64
		mockFunc      func() *mocks.MockUserService
		expectedError error
		validateResp  func(t *testing.T, resp *dto.AuthUserResponseDTO)
	}{
		{
			name:   "successful get user me",
			userID: 1,
			mockFunc: func() *mocks.MockUserService {
				return &mocks.MockUserService{
					GetUserProfileFunc: func(ctx context.Context) (*domain.UserProfile, error) {
						return &domain.UserProfile{
							ID:         1,
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
					GetUserProfileFunc: func(ctx context.Context) (*domain.UserProfile, error) {
						return nil, &gtk.NotFoundError{Message: "user not found"}
					},
				}
			},
			expectedError: &gtk.NotFoundError{Message: "user not found"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.mockFunc()

			req := httptest.NewRequest(http.MethodGet, "/api/users/me", nil)
			ctx := context.WithValue(req.Context(), utils.AuthUserContextKey, &domain.AuthUser{
				UserID:   1,
				Email:    "test@example.com",
				Username: "testuser",
				Verified: true,
			})
			req = req.WithContext(ctx)

			w := httptest.NewRecorder()

			controller := getUserMeController(mockService)
			resp, err := controller(w, req)

			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tt.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				require.Equal(t, http.StatusOK, resp.StatusCode)
				profileResp, ok := resp.Body.(dto.AuthUserResponseDTO)
				require.True(t, ok, "response body should be AuthUserResponseDTO")
				tt.validateResp(t, &profileResp)
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
					SearchUserProfilesFunc: func(ctx context.Context, req *dto.SearchUsersDTO) ([]*domain.UserProfile, error) {
						return []*domain.UserProfile{
							{ID: 1, GlobalName: "test user 1"},
							{ID: 2, GlobalName: "test user 2"},
						}, nil
					},
					GetUserProfileWithContactFunc: func(ctx context.Context, req *dto.GetUserByIDDTO) (*domain.UserProfile, *domain.Contact, error) {
						return &domain.UserProfile{ID: req.ID}, nil, nil
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
				return &mocks.MockUserService{}
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
			ctx := context.WithValue(req.Context(), utils.AuthUserContextKey, &domain.AuthUser{
				UserID:   1,
				Email:    "test@example.com",
				Username: "testuser",
				Verified: true,
			})
			req = req.WithContext(ctx)
			w := httptest.NewRecorder()

			controller := searchUserProfilesController(mockService)
			resp, err := controller(w, req)

			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tt.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				require.Equal(t, http.StatusOK, resp.StatusCode)
				profiles, ok := resp.Body.([]dto.UserProfileResponseDTO)
				require.True(t, ok, "response body should be []UserProfileResponseDTO")
				tt.validateResp(t, profiles)
			}
		})
	}
}

func TestUserHandler_UpdateUserMe(t *testing.T) {
	tests := []struct {
		name          string
		userID        int64
		requestBody   *dto.UpdateUserDTO
		mockFunc      func() *mocks.MockUserService
		expectedError error
		validateResp  func(t *testing.T, profile *domain.UserProfile)
	}{
		{
			name:   "successful update all fields",
			userID: 1,
			requestBody: &dto.UpdateUserDTO{
				GlobalName: strPtr("Updated Name"),
				Bio:        strPtr("Updated Bio"),
			},
			mockFunc: func() *mocks.MockUserService {
				return &mocks.MockUserService{
					UpdateUserProfileFunc: func(ctx context.Context, req *dto.UpdateUserDTO) (*domain.UserProfile, error) {
						return &domain.UserProfile{
							ID:         1,
							GlobalName: *req.GlobalName,
							Bio:        *req.Bio,
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
			ctx := context.WithValue(req.Context(), utils.AuthUserContextKey, &domain.AuthUser{
				UserID:   1,
				Email:    "test@example.com",
				Username: "testuser",
				Verified: true,
			})
			req = req.WithContext(ctx)

			w := httptest.NewRecorder()

			controller := updateUserMeController(mockService)
			resp, err := controller(w, req)

			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tt.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				require.Equal(t, http.StatusOK, resp.StatusCode)
			}
		})
	}
}

// Helper function to create string pointers
func strPtr(s string) *string {
	return &s
}

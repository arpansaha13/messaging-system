package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service/mocks"
)

func TestChannelHandler_CreateChannel(t *testing.T) {
	tests := []struct {
		name          string
		groupID       string
		requestBody   *dto.CreateChannelRequestDTO
		mockFunc      func() *mocks.MockChannelService
		expectedError bool
		expectedCode  int
		validateResp  func(t *testing.T, channel *dto.ChannelResponseDTO)
	}{
		{
			name:    "successful create channel",
			groupID: "1",
			requestBody: &dto.CreateChannelRequestDTO{
				Name: "general",
			},
			mockFunc: func() *mocks.MockChannelService {
				return &mocks.MockChannelService{
					CreateChannelFunc: func(ctx context.Context, name string, groupID int64) (*domain.Channel, error) {
						return &domain.Channel{
							ID:      1,
							Name:    name,
							GroupID: groupID,
						}, nil
					},
				}
			},
			expectedError: false,
			expectedCode:  http.StatusCreated,
			validateResp: func(t *testing.T, channel *dto.ChannelResponseDTO) {
				assert.Equal(t, int64(1), channel.ID)
				assert.Equal(t, "general", channel.Name)
				assert.Equal(t, int64(1), channel.GroupID)
			},
		},
		{
			name:    "invalid group id",
			groupID: "invalid",
			requestBody: &dto.CreateChannelRequestDTO{
				Name: "general",
			},
			mockFunc: func() *mocks.MockChannelService {
				return &mocks.MockChannelService{}
			},
			expectedError: true,
			expectedCode:  http.StatusBadRequest,
		},
		{
			name:    "empty channel name",
			groupID: "1",
			requestBody: &dto.CreateChannelRequestDTO{
				Name: "",
			},
			mockFunc: func() *mocks.MockChannelService {
				return &mocks.MockChannelService{}
			},
			expectedError: true,
			expectedCode:  http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.mockFunc()

			body, err := json.Marshal(tt.requestBody)
			require.NoError(t, err)

			req := httptest.NewRequest(http.MethodPost, "/api/groups/"+tt.groupID+"/channels", bytes.NewBuffer(body))

			// Add mux vars to request
			req = mux.SetURLVars(req, map[string]string{"groupID": tt.groupID})

			w := httptest.NewRecorder()

			router := mux.NewRouter()
			SetupChannelRoutes(router, router, mockService)
			router.ServeHTTP(w, req)

			if tt.expectedError {
				assert.NotEqual(t, http.StatusCreated, w.Code)
			} else {
				assert.Equal(t, tt.expectedCode, w.Code)
				var resp dto.ChannelResponseDTO
				err := json.NewDecoder(w.Body).Decode(&resp)
				require.NoError(t, err)
				tt.validateResp(t, &resp)
			}
		})
	}
}

func TestChannelHandler_GetGroupChannels(t *testing.T) {
	tests := []struct {
		name          string
		groupID       string
		mockFunc      func() *mocks.MockChannelService
		expectedError bool
		expectedCode  int
		validateResp  func(t *testing.T, channels []dto.ChannelResponseDTO)
	}{
		{
			name:    "successful get group channels",
			groupID: "1",
			mockFunc: func() *mocks.MockChannelService {
				return &mocks.MockChannelService{
					GetChannelsByGroupIDFunc: func(ctx context.Context, groupID int64) ([]*domain.Channel, error) {
						return []*domain.Channel{
							{
								ID:      1,
								Name:    "general",
								GroupID: groupID,
							},
							{
								ID:      2,
								Name:    "random",
								GroupID: groupID,
							},
						}, nil
					},
				}
			},
			expectedError: false,
			expectedCode:  http.StatusOK,
			validateResp: func(t *testing.T, channels []dto.ChannelResponseDTO) {
				assert.Equal(t, 2, len(channels))
				assert.Equal(t, "general", channels[0].Name)
				assert.Equal(t, "random", channels[1].Name)
			},
		},
		{
			name:    "invalid group id",
			groupID: "invalid",
			mockFunc: func() *mocks.MockChannelService {
				return &mocks.MockChannelService{}
			},
			expectedError: true,
			expectedCode:  http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.mockFunc()

			req := httptest.NewRequest(http.MethodGet, "/api/groups/"+tt.groupID+"/channels", nil)

			// Add mux vars to request
			req = mux.SetURLVars(req, map[string]string{"groupID": tt.groupID})

			w := httptest.NewRecorder()

			router := mux.NewRouter()
			SetupChannelRoutes(router, router, mockService)
			router.ServeHTTP(w, req)

			if tt.expectedError {
				assert.NotEqual(t, http.StatusOK, w.Code)
			} else {
				assert.Equal(t, tt.expectedCode, w.Code)
				var resp []dto.ChannelResponseDTO
				err := json.NewDecoder(w.Body).Decode(&resp)
				require.NoError(t, err)
				tt.validateResp(t, resp)
			}
		})
	}
}

func TestChannelHandler_GetChannelInfo(t *testing.T) {
	tests := []struct {
		name          string
		channelID     string
		mockFunc      func() *mocks.MockChannelService
		expectedError bool
		expectedCode  int
		validateResp  func(t *testing.T, channel *dto.ChannelResponseDTO)
	}{
		{
			name:      "successful get channel info",
			channelID: "1",
			mockFunc: func() *mocks.MockChannelService {
				return &mocks.MockChannelService{
					GetChannelByIDFunc: func(ctx context.Context, channelID int64) (*domain.Channel, error) {
						return &domain.Channel{
							ID:      1,
							Name:    "general",
							GroupID: 1,
						}, nil
					},
				}
			},
			expectedError: false,
			expectedCode:  http.StatusOK,
			validateResp: func(t *testing.T, channel *dto.ChannelResponseDTO) {
				assert.Equal(t, int64(1), channel.ID)
				assert.Equal(t, "general", channel.Name)
			},
		},
		{
			name:      "invalid channel id",
			channelID: "invalid",
			mockFunc: func() *mocks.MockChannelService {
				return &mocks.MockChannelService{}
			},
			expectedError: true,
			expectedCode:  http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.mockFunc()

			req := httptest.NewRequest(http.MethodGet, "/api/channels/"+tt.channelID, nil)

			// Add mux vars to request
			req = mux.SetURLVars(req, map[string]string{"channelID": tt.channelID})

			w := httptest.NewRecorder()

			router := mux.NewRouter()
			SetupChannelRoutes(router, router, mockService)
			router.ServeHTTP(w, req)

			if tt.expectedError {
				assert.NotEqual(t, http.StatusOK, w.Code)
			} else {
				assert.Equal(t, tt.expectedCode, w.Code)
				var resp dto.ChannelResponseDTO
				err := json.NewDecoder(w.Body).Decode(&resp)
				require.NoError(t, err)
				tt.validateResp(t, &resp)
			}
		})
	}
}

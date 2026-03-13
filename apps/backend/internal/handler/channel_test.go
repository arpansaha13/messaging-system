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

	gtk "github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/tests/mocks"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

func TestChannelHandler_CreateChannel(t *testing.T) {
	tests := []struct {
		name          string
		groupID       string
		requestBody   *dto.CreateChannelRequestDTO
		mockFunc      func() *mocks.MockChannelService
		expectedError error
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
					CreateChannelFunc: func(ctx context.Context, userID int64, name string, groupID int64) (*domain.Channel, error) {
						return &domain.Channel{
							ID:      1,
							Name:    name,
							GroupID: groupID,
						}, nil
					},
				}
			},
			expectedError: nil,
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
			expectedError: &gtk.ValidationError{Message: "invalid group id"},
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
			expectedError: &gtk.ValidationError{Message: "channel name is required"},
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

			controller := createChannelController(mockService)
			resp, err := controller(w, req)

			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tt.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				require.Equal(t, http.StatusCreated, resp.StatusCode)
				chanResp, ok := resp.Body.(dto.ChannelResponseDTO)
				require.True(t, ok, "response body should be ChannelResponseDTO")
				tt.validateResp(t, &chanResp)
			}
		})
	}
}

func TestChannelHandler_GetGroupChannels(t *testing.T) {
	tests := []struct {
		name          string
		groupID       string
		mockFunc      func() *mocks.MockChannelService
		expectedError error
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
			expectedError: nil,
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
			expectedError: &gtk.ValidationError{Message: "invalid group id"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.mockFunc()

			req := httptest.NewRequest(http.MethodGet, "/api/groups/"+tt.groupID+"/channels", nil)

			// Add mux vars to request
			req = mux.SetURLVars(req, map[string]string{"groupID": tt.groupID})

			w := httptest.NewRecorder()

			controller := getGroupChannelsController(mockService)
			resp, err := controller(w, req)

			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tt.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				require.Equal(t, http.StatusOK, resp.StatusCode)
				channels, ok := resp.Body.([]dto.ChannelResponseDTO)
				require.True(t, ok, "response body should be []ChannelResponseDTO")
				tt.validateResp(t, channels)
			}
		})
	}
}

func TestChannelHandler_GetChannelInfo(t *testing.T) {
	tests := []struct {
		name          string
		channelID     string
		mockFunc      func() *mocks.MockChannelService
		expectedError error
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
			expectedError: nil,
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
			expectedError: &gtk.ValidationError{Message: "invalid channel id"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.mockFunc()

			req := httptest.NewRequest(http.MethodGet, "/api/channels/"+tt.channelID, nil)

			// Add mux vars to request
			req = mux.SetURLVars(req, map[string]string{"channelID": tt.channelID})

			w := httptest.NewRecorder()

			controller := getChannelInfoController(mockService)
			resp, err := controller(w, req)

			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tt.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				require.Equal(t, http.StatusOK, resp.StatusCode)
				chanResp, ok := resp.Body.(dto.ChannelResponseDTO)
				require.True(t, ok, "response body should be ChannelResponseDTO")
				tt.validateResp(t, &chanResp)
			}
		})
	}
}

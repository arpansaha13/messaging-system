package service

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository/mocks"
)

func TestChannelServiceCreateChannel(t *testing.T) {
	tests := []struct {
		name          string
		channelName   string
		groupID       int64
		mockFunc      func() *mocks.MockChannelRepository
		expectedError bool
		validateResp  func(t *testing.T, channel *domain.Channel)
	}{
		{
			name:        "successful create channel",
			channelName: "general",
			groupID:     1,
			mockFunc: func() *mocks.MockChannelRepository {
				return &mocks.MockChannelRepository{
					CreateFunc: func(ctx context.Context, channel *domain.Channel) error {
						channel.ID = 1
						return nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, channel *domain.Channel) {
				assert.Equal(t, "general", channel.Name)
				assert.Equal(t, int64(1), channel.GroupID)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			mockGroupRepo := &mocks.MockGroupRepository{}
			svc := NewChannelService(mockRepo, mockGroupRepo)

			channel, err := svc.CreateChannel(context.Background(), tt.channelName, tt.groupID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, channel)
			}
		})
	}
}

func TestChannelServiceGetChannels(t *testing.T) {
	tests := []struct {
		name          string
		mockFunc      func() *mocks.MockChannelRepository
		expectedError bool
		validateResp  func(t *testing.T, channels []*domain.Channel)
	}{
		{
			name: "successful get all channels",
			mockFunc: func() *mocks.MockChannelRepository {
				return &mocks.MockChannelRepository{
					GetAllFunc: func(ctx context.Context) ([]*domain.Channel, error) {
						return []*domain.Channel{
							{ID: 1, Name: "general", GroupID: 1},
							{ID: 2, Name: "random", GroupID: 1},
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, channels []*domain.Channel) {
				assert.Len(t, channels, 2)
				assert.Equal(t, "general", channels[0].Name)
				assert.Equal(t, "random", channels[1].Name)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			mockGroupRepo := &mocks.MockGroupRepository{}
			svc := NewChannelService(mockRepo, mockGroupRepo)

			channels, err := svc.GetChannels(context.Background())

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, channels)
			}
		})
	}
}

func TestChannelServiceGetChannelsByGroupID(t *testing.T) {
	tests := []struct {
		name          string
		groupID       int64
		mockFunc      func() *mocks.MockChannelRepository
		expectedError bool
		validateResp  func(t *testing.T, channels []*domain.Channel)
	}{
		{
			name:    "successful get channels by group id",
			groupID: 1,
			mockFunc: func() *mocks.MockChannelRepository {
				return &mocks.MockChannelRepository{
					GetByGroupIDFunc: func(ctx context.Context, groupID int64) ([]*domain.Channel, error) {
						if groupID == 1 {
							return []*domain.Channel{
								{ID: 1, Name: "general", GroupID: 1},
								{ID: 2, Name: "random", GroupID: 1},
							}, nil
						}
						return []*domain.Channel{}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, channels []*domain.Channel) {
				assert.Len(t, channels, 2)
				assert.Equal(t, int64(1), channels[0].GroupID)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			mockGroupRepo := &mocks.MockGroupRepository{}
			svc := NewChannelService(mockRepo, mockGroupRepo)

			channels, err := svc.GetChannelsByGroupID(context.Background(), tt.groupID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, channels)
			}
		})
	}
}

func TestChannelServiceGetChannelByID(t *testing.T) {
	tests := []struct {
		name          string
		channelID     int64
		mockFunc      func() *mocks.MockChannelRepository
		expectedError bool
		validateResp  func(t *testing.T, channel *domain.Channel)
	}{
		{
			name:      "successful get channel by id",
			channelID: 1,
			mockFunc: func() *mocks.MockChannelRepository {
				return &mocks.MockChannelRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.Channel, error) {
						return &domain.Channel{
							ID:      id,
							Name:    "general",
							GroupID: 1,
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, channel *domain.Channel) {
				assert.Equal(t, int64(1), channel.ID)
				assert.Equal(t, "general", channel.Name)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			mockGroupRepo := &mocks.MockGroupRepository{}
			svc := NewChannelService(mockRepo, mockGroupRepo)

			channel, err := svc.GetChannelByID(context.Background(), tt.channelID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, channel)
			}
		})
	}
}

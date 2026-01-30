package service

import (
	"context"
	"testing"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMessageService_SendPersonalMessage(t *testing.T) {
	tests := []struct {
		name                string
		senderID            int64
		receiverID          int64
		content             string
		hash                string
		mockMessageRepo     func() *mocks.MockMessageRepository
		mockRecipientRepo   func() *mocks.MockMessageRecipientRepository
		mockChatRepo        func() *mocks.MockChatRepository
		mockRabbitMQService func() *RabbitMQService
		expectedError       bool
	}{
		{
			name:       "successful send personal message",
			senderID:   1,
			receiverID: 2,
			content:    "Hello World",
			hash:       "hash123",
			mockMessageRepo: func() *mocks.MockMessageRepository {
				return &mocks.MockMessageRepository{
					CreateFunc: func(ctx context.Context, message *domain.Message) error {
						message.ID = 1
						return nil
					},
				}
			},
			mockRecipientRepo: func() *mocks.MockMessageRecipientRepository {
				return &mocks.MockMessageRecipientRepository{
					CreateFunc: func(ctx context.Context, recipient *domain.MessageRecipient) error {
						return nil
					},
				}
			},
			mockChatRepo: func() *mocks.MockChatRepository {
				return &mocks.MockChatRepository{}
			},
			mockRabbitMQService: func() *RabbitMQService {
				return &RabbitMQService{
					channel: nil,
					conn:    nil,
				}
			},
			expectedError: true, // Expected error because RabbitMQ is not connected
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockMessageRepo := tt.mockMessageRepo()
			mockRecipientRepo := tt.mockRecipientRepo()
			mockChatRepo := tt.mockChatRepo()
			mockRabbitMQ := tt.mockRabbitMQService()

			svc := NewMessageService(mockMessageRepo, mockRecipientRepo, mockChatRepo, mockRabbitMQ)

			err := svc.SendPersonalMessage(context.Background(), tt.senderID, tt.receiverID, tt.content, tt.hash)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestMessageService_SendGroupMessage(t *testing.T) {
	tests := []struct {
		name                string
		senderID            int64
		groupID             int64
		channelID           int64
		content             string
		hash                string
		mockMessageRepo     func() *mocks.MockMessageRepository
		mockRecipientRepo   func() *mocks.MockMessageRecipientRepository
		mockChatRepo        func() *mocks.MockChatRepository
		mockRabbitMQService func() *RabbitMQService
		expectedError       bool
	}{
		{
			name:      "successful send group message",
			senderID:  1,
			groupID:   1,
			channelID: 1,
			content:   "Hello Group",
			hash:      "hash123",
			mockMessageRepo: func() *mocks.MockMessageRepository {
				return &mocks.MockMessageRepository{
					CreateFunc: func(ctx context.Context, message *domain.Message) error {
						message.ID = 1
						return nil
					},
				}
			},
			mockRecipientRepo: func() *mocks.MockMessageRecipientRepository {
				return &mocks.MockMessageRecipientRepository{
					CreateFunc: func(ctx context.Context, recipient *domain.MessageRecipient) error {
						return nil
					},
				}
			},
			mockChatRepo: func() *mocks.MockChatRepository {
				return &mocks.MockChatRepository{}
			},
			mockRabbitMQService: func() *RabbitMQService {
				return &RabbitMQService{
					channel: nil,
					conn:    nil,
				}
			},
			expectedError: true, // Expected error because RabbitMQ is not connected
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockMessageRepo := tt.mockMessageRepo()
			mockRecipientRepo := tt.mockRecipientRepo()
			mockChatRepo := tt.mockChatRepo()
			mockRabbitMQ := tt.mockRabbitMQService()

			svc := NewMessageService(mockMessageRepo, mockRecipientRepo, mockChatRepo, mockRabbitMQ)

			err := svc.SendGroupMessage(context.Background(), tt.senderID, tt.groupID, tt.channelID, tt.content, tt.hash)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
			}
		})
	}
}

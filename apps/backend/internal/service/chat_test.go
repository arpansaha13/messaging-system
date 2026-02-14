package service_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/tests/mocks"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

func TestChatService_GetUserChats(t *testing.T) {
	tests := []struct {
		name            string
		userID          int64
		mockChatRepo    func() *mocks.MockChatRepository
		mockMessageRepo func() *mocks.MockMessageRepository
		expectedError   bool
	}{
		{
			name:   "successful get user chats",
			userID: 1,
			mockChatRepo: func() *mocks.MockChatRepository {
				return &mocks.MockChatRepository{
					GetUserChatsFunc: func(ctx context.Context, userID int64) ([]*repository.ChatWithReceiverInfo, error) {
						return []*repository.ChatWithReceiverInfo{}, nil
					},
				}
			},
			mockMessageRepo: func() *mocks.MockMessageRepository {
				return &mocks.MockMessageRepository{}
			},
			expectedError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockChatRepo := tt.mockChatRepo()
			mockMessageRepo := tt.mockMessageRepo()
			svc := service.NewChatService(mockChatRepo, mockMessageRepo)

			response, err := svc.GetUserChats(context.Background(), tt.userID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.NotNil(t, response)
			}
		})
	}
}

func TestChatService_PinChat(t *testing.T) {
	tests := []struct {
		name            string
		userID          int64
		receiverID      int64
		mockChatRepo    func() *mocks.MockChatRepository
		mockMessageRepo func() *mocks.MockMessageRepository
		expectedError   bool
	}{
		{
			name:       "successful pin chat",
			userID:     1,
			receiverID: 2,
			mockChatRepo: func() *mocks.MockChatRepository {
				return &mocks.MockChatRepository{
					GetByUsersFunc: func(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error) {
						return &domain.Chat{ID: 1, SenderID: user1ID, ReceiverID: user2ID, Pinned: false}, nil
					},
					UpdateFunc: func(ctx context.Context, chat *domain.Chat) error {
						return nil
					},
				}
			},
			mockMessageRepo: func() *mocks.MockMessageRepository {
				return &mocks.MockMessageRepository{}
			},
			expectedError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockChatRepo := tt.mockChatRepo()
			mockMessageRepo := tt.mockMessageRepo()
			svc := service.NewChatService(mockChatRepo, mockMessageRepo)

			err := svc.PinChat(context.Background(), tt.userID, tt.receiverID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestChatService_UnpinChat(t *testing.T) {
	tests := []struct {
		name            string
		userID          int64
		receiverID      int64
		mockChatRepo    func() *mocks.MockChatRepository
		mockMessageRepo func() *mocks.MockMessageRepository
		expectedError   bool
	}{
		{
			name:       "successful unpin chat",
			userID:     1,
			receiverID: 2,
			mockChatRepo: func() *mocks.MockChatRepository {
				return &mocks.MockChatRepository{
					GetByUsersFunc: func(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error) {
						return &domain.Chat{ID: 1, SenderID: user1ID, ReceiverID: user2ID, Pinned: true}, nil
					},
					UpdateFunc: func(ctx context.Context, chat *domain.Chat) error {
						return nil
					},
				}
			},
			mockMessageRepo: func() *mocks.MockMessageRepository {
				return &mocks.MockMessageRepository{}
			},
			expectedError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockChatRepo := tt.mockChatRepo()
			mockMessageRepo := tt.mockMessageRepo()
			svc := service.NewChatService(mockChatRepo, mockMessageRepo)

			err := svc.UnpinChat(context.Background(), tt.userID, tt.receiverID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestChatService_ArchiveChat(t *testing.T) {
	tests := []struct {
		name            string
		userID          int64
		receiverID      int64
		mockChatRepo    func() *mocks.MockChatRepository
		mockMessageRepo func() *mocks.MockMessageRepository
		expectedError   bool
	}{
		{
			name:       "successful archive chat",
			userID:     1,
			receiverID: 2,
			mockChatRepo: func() *mocks.MockChatRepository {
				return &mocks.MockChatRepository{
					GetByUsersFunc: func(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error) {
						return &domain.Chat{ID: 1, SenderID: user1ID, ReceiverID: user2ID, Archived: false}, nil
					},
					UpdateFunc: func(ctx context.Context, chat *domain.Chat) error {
						return nil
					},
				}
			},
			mockMessageRepo: func() *mocks.MockMessageRepository {
				return &mocks.MockMessageRepository{}
			},
			expectedError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockChatRepo := tt.mockChatRepo()
			mockMessageRepo := tt.mockMessageRepo()
			svc := service.NewChatService(mockChatRepo, mockMessageRepo)

			err := svc.ArchiveChat(context.Background(), tt.userID, tt.receiverID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestChatService_UnarchiveChat(t *testing.T) {
	tests := []struct {
		name            string
		userID          int64
		receiverID      int64
		mockChatRepo    func() *mocks.MockChatRepository
		mockMessageRepo func() *mocks.MockMessageRepository
		expectedError   bool
	}{
		{
			name:       "successful unarchive chat",
			userID:     1,
			receiverID: 2,
			mockChatRepo: func() *mocks.MockChatRepository {
				return &mocks.MockChatRepository{
					GetByUsersFunc: func(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error) {
						return &domain.Chat{ID: 1, SenderID: user1ID, ReceiverID: user2ID, Archived: true}, nil
					},
					UpdateFunc: func(ctx context.Context, chat *domain.Chat) error {
						return nil
					},
				}
			},
			mockMessageRepo: func() *mocks.MockMessageRepository {
				return &mocks.MockMessageRepository{}
			},
			expectedError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockChatRepo := tt.mockChatRepo()
			mockMessageRepo := tt.mockMessageRepo()
			svc := service.NewChatService(mockChatRepo, mockMessageRepo)

			err := svc.UnarchiveChat(context.Background(), tt.userID, tt.receiverID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestChatService_ClearChat(t *testing.T) {
	tests := []struct {
		name            string
		userID          int64
		receiverID      int64
		mockChatRepo    func() *mocks.MockChatRepository
		mockMessageRepo func() *mocks.MockMessageRepository
		expectedError   bool
	}{
		{
			name:       "successful clear chat",
			userID:     1,
			receiverID: 2,
			mockChatRepo: func() *mocks.MockChatRepository {
				return &mocks.MockChatRepository{
					GetByUsersFunc: func(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error) {
						return &domain.Chat{ID: 1, SenderID: user1ID, ReceiverID: user2ID}, nil
					},
					UpdateFunc: func(ctx context.Context, chat *domain.Chat) error {
						return nil
					},
				}
			},
			mockMessageRepo: func() *mocks.MockMessageRepository {
				return &mocks.MockMessageRepository{}
			},
			expectedError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockChatRepo := tt.mockChatRepo()
			mockMessageRepo := tt.mockMessageRepo()
			svc := service.NewChatService(mockChatRepo, mockMessageRepo)

			err := svc.ClearChat(context.Background(), tt.userID, tt.receiverID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestChatService_DeleteChat(t *testing.T) {
	tests := []struct {
		name            string
		userID          int64
		receiverID      int64
		mockChatRepo    func() *mocks.MockChatRepository
		mockMessageRepo func() *mocks.MockMessageRepository
		expectedError   bool
	}{
		{
			name:       "successful delete chat",
			userID:     1,
			receiverID: 2,
			mockChatRepo: func() *mocks.MockChatRepository {
				return &mocks.MockChatRepository{
					GetByUsersFunc: func(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error) {
						return &domain.Chat{ID: 1, SenderID: user1ID, ReceiverID: user2ID}, nil
					},
					DeleteFunc: func(ctx context.Context, chatID int64) error {
						return nil
					},
				}
			},
			mockMessageRepo: func() *mocks.MockMessageRepository {
				return &mocks.MockMessageRepository{}
			},
			expectedError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockChatRepo := tt.mockChatRepo()
			mockMessageRepo := tt.mockMessageRepo()
			svc := service.NewChatService(mockChatRepo, mockMessageRepo)

			err := svc.DeleteChat(context.Background(), tt.userID, tt.receiverID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
			}
		})
	}
}

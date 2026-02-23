package service

import (
	"context"
	"sort"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// ChatItemDTO represents a chat with its latest message and receiver info
type ChatItemDTO struct {
	LatestMsg *dto.MessageResponseDTO `json:"latestMsg"`
	Receiver  *ChatReceiverDTO        `json:"receiver"`
	Chat      *ChatMetadataDTO        `json:"chat"`
}

type ChatReceiverDTO struct {
	ID         int64   `json:"id"`
	DP         *string `json:"dp"`
	Bio        string  `json:"bio"`
	GlobalName string  `json:"globalName"`
}

type ChatMetadataDTO struct {
	Muted    bool `json:"muted"`
	Pinned   bool `json:"pinned"`
	Archived bool `json:"archived"`
}

type ChatsResponseDTO struct {
	Unarchived []*ChatItemDTO `json:"unarchived"`
	Archived   []*ChatItemDTO `json:"archived"`
}

// ChatService handles chat business logic
type ChatService struct {
	chatRepo    repository.IChatRepository
	messageRepo repository.IMessageRepository
}

// NewChatService creates a new chat service
func NewChatService(chatRepo repository.IChatRepository, messageRepo repository.IMessageRepository) *ChatService {
	return &ChatService{
		chatRepo:    chatRepo,
		messageRepo: messageRepo,
	}
}

// CreateChat creates a new chat between two users
func (s *ChatService) CreateChat(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error) {
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("creating chat", zap.Int64("user_1_id", user1ID), zap.Int64("user_2_id", user2ID))

	// Check if chat already exists
	existing, err := s.chatRepo.GetByUsers(ctx, user1ID, user2ID)
	if err != nil {
		log.Error("failed to check existing chat", zap.Int64("user_1_id", user1ID), zap.Int64("user_2_id", user2ID), zap.Error(err))
		return nil, err
	}

	if existing != nil {
		log.Debug("chat already exists", zap.Int64("chat_id", existing.ID))
		return existing, nil
	}

	chat := &domain.Chat{
		SenderID:   user1ID,
		ReceiverID: user2ID,
	}

	if err := s.chatRepo.Create(ctx, chat); err != nil {
		log.Error("failed to create chat in repository", zap.Int64("user_1_id", user1ID), zap.Int64("user_2_id", user2ID), zap.Error(err))
		return nil, err
	}

	log.Info("chat created successfully", zap.Int64("chat_id", chat.ID))
	return chat, nil
}

// GetUserChats retrieves all chats for a user split into archived and unarchived
func (s *ChatService) GetUserChats(ctx context.Context, userID int64) (*ChatsResponseDTO, error) {
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("retrieving user chats", zap.Int64("user_id", userID))

	chats, err := s.chatRepo.GetUserChats(ctx, userID)
	if err != nil {
		log.Error("failed to retrieve user chats", zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}

	response := &ChatsResponseDTO{
		Unarchived: []*ChatItemDTO{},
		Archived:   []*ChatItemDTO{},
	}

	// Build a map of chats to their metadata
	chatMetadataMap := make(map[int64]*ChatMetadataDTO)
	receiverInfoMap := make(map[int64]*ChatReceiverDTO)

	for _, chat := range chats {
		chatMetadataMap[chat.ID] = &ChatMetadataDTO{
			Muted:    chat.Muted,
			Pinned:   chat.Pinned,
			Archived: chat.Archived,
		}

		receiverInfoMap[chat.ReceiverID_pk] = &ChatReceiverDTO{
			ID:         chat.ReceiverID_pk,
			DP:         chat.ReceiverDP,
			Bio:        chat.ReceiverBio,
			GlobalName: chat.ReceiverGlobalName,
		}
	}

	// Get latest messages for each chat
	for _, chat := range chats {
		latestMsg, err := s.messageRepo.GetLatestMessageByUsersInChat(ctx, userID, chat.ReceiverID, chat.ClearedAt)
		if err != nil {
			// Only log at Debug if it's a not-found error; otherwise warn
			if _, isNotFound := err.(*domain.NotFoundError); isNotFound {
				log.Debug("no latest message found for chat", zap.Int64("chat_id", chat.ID))
			} else {
				log.Warn("failed to get latest message for chat", zap.Int64("chat_id", chat.ID), zap.Error(err))
			}
			// Continue with nil message
		}

		var latestMsgDTO *dto.MessageResponseDTO
		if latestMsg != nil {
			latestMsgDTO = &dto.MessageResponseDTO{
				ID:        latestMsg.ID,
				SenderID:  latestMsg.SenderID,
				Content:   latestMsg.Content,
				Status:    latestMsg.Status,
				CreatedAt: latestMsg.CreatedAt,
				UpdatedAt: latestMsg.UpdatedAt,
			}
		}

		item := &ChatItemDTO{
			LatestMsg: latestMsgDTO,
			Receiver:  receiverInfoMap[chat.ReceiverID_pk],
			Chat:      chatMetadataMap[chat.ID],
		}

		if item.Chat.Archived {
			response.Archived = append(response.Archived, item)
		} else {
			response.Unarchived = append(response.Unarchived, item)
		}
	}

	// Sort both lists
	sortChats(response.Unarchived)
	sortChats(response.Archived)

	log.Debug("user chats retrieved successfully", zap.Int64("user_id", userID), zap.Int("total_chats", len(chats)), zap.Int("unarchived_count", len(response.Unarchived)), zap.Int("archived_count", len(response.Archived)))
	return response, nil
}

// sortChats sorts chats by pinned status, then by latest message timestamp
func sortChats(items []*ChatItemDTO) {
	sort.Slice(items, func(i, j int) bool {
		a, b := items[i], items[j]

		// Pinned chats on top
		if a.Chat.Pinned && !b.Chat.Pinned {
			return true
		}
		if !a.Chat.Pinned && b.Chat.Pinned {
			return false
		}

		// Cleared conversations at bottom
		if a.LatestMsg == nil && b.LatestMsg == nil {
			return false
		}
		if b.LatestMsg == nil {
			return true
		}
		if a.LatestMsg == nil {
			return false
		}

		// Latest message on top
		return a.LatestMsg.CreatedAt.After(b.LatestMsg.CreatedAt)
	})
}

// Pin pins a chat for a user
func (s *ChatService) PinChat(ctx context.Context, userID, receiverID int64) error {
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("pinning chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID))

	chat, err := s.chatRepo.GetByUsers(ctx, userID, receiverID)
	if err != nil {
		log.Error("failed to get chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID), zap.Error(err))
		return err
	}

	if chat == nil {
		log.Warn("chat not found", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID))
		return &domain.NotFoundError{Message: "chat not found"}
	}

	chat.Pinned = true
	chat.Archived = false // Unarchive when pinning

	if err := s.chatRepo.Update(ctx, chat); err != nil {
		log.Error("failed to pin chat", zap.Int64("chat_id", chat.ID), zap.Error(err))
		return err
	}

	log.Info("chat pinned successfully", zap.Int64("chat_id", chat.ID))
	return nil
}

// Unpin unpins a chat for a user
func (s *ChatService) UnpinChat(ctx context.Context, userID, receiverID int64) error {
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("unpinning chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID))

	chat, err := s.chatRepo.GetByUsers(ctx, userID, receiverID)
	if err != nil {
		log.Error("failed to get chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID), zap.Error(err))
		return err
	}

	if chat == nil {
		log.Warn("chat not found", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID))
		return &domain.NotFoundError{Message: "chat not found"}
	}

	chat.Pinned = false

	if err := s.chatRepo.Update(ctx, chat); err != nil {
		log.Error("failed to unpin chat", zap.Int64("chat_id", chat.ID), zap.Error(err))
		return err
	}

	log.Info("chat unpinned successfully", zap.Int64("chat_id", chat.ID))
	return nil
}

// Archive archives a chat for a user
func (s *ChatService) ArchiveChat(ctx context.Context, userID, receiverID int64) error {
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("archiving chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID))

	chat, err := s.chatRepo.GetByUsers(ctx, userID, receiverID)
	if err != nil {
		log.Error("failed to get chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID), zap.Error(err))
		return err
	}

	if chat == nil {
		log.Warn("chat not found", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID))
		return &domain.NotFoundError{Message: "chat not found"}
	}

	chat.Archived = true
	chat.Pinned = false // Unpin when archiving

	if err := s.chatRepo.Update(ctx, chat); err != nil {
		log.Error("failed to archive chat", zap.Int64("chat_id", chat.ID), zap.Error(err))
		return err
	}

	log.Info("chat archived successfully", zap.Int64("chat_id", chat.ID))
	return nil
}

// Unarchive unarchives a chat for a user
func (s *ChatService) UnarchiveChat(ctx context.Context, userID, receiverID int64) error {
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("unarchiving chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID))

	chat, err := s.chatRepo.GetByUsers(ctx, userID, receiverID)
	if err != nil {
		log.Error("failed to get chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID), zap.Error(err))
		return err
	}

	if chat == nil {
		log.Warn("chat not found", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID))
		return &domain.NotFoundError{Message: "chat not found"}
	}

	chat.Archived = false

	if err := s.chatRepo.Update(ctx, chat); err != nil {
		log.Error("failed to unarchive chat", zap.Int64("chat_id", chat.ID), zap.Error(err))
		return err
	}

	log.Info("chat unarchived successfully", zap.Int64("chat_id", chat.ID))
	return nil
}

// ClearChat clears message history for a chat
func (s *ChatService) ClearChat(ctx context.Context, userID, receiverID int64) error {
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("clearing chat history", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID))

	chat, err := s.chatRepo.GetByUsers(ctx, userID, receiverID)
	if err != nil {
		log.Error("failed to get chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID), zap.Error(err))
		return err
	}

	if chat == nil {
		log.Warn("chat not found", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID))
		return &domain.NotFoundError{Message: "chat not found"}
	}

	now := domain.Now()
	chat.ClearedAt = &now

	if err := s.chatRepo.Update(ctx, chat); err != nil {
		log.Error("failed to clear chat", zap.Int64("chat_id", chat.ID), zap.Error(err))
		return err
	}

	log.Info("chat cleared successfully", zap.Int64("chat_id", chat.ID))
	return nil
}

// DeleteChat deletes a chat
func (s *ChatService) DeleteChat(ctx context.Context, userID, receiverID int64) error {
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("deleting chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID))

	chat, err := s.chatRepo.GetByUsers(ctx, userID, receiverID)
	if err != nil {
		log.Error("failed to get chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID), zap.Error(err))
		return err
	}

	if chat == nil {
		log.Warn("chat not found", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID))
		return &domain.NotFoundError{Message: "chat not found"}
	}

	if err := s.chatRepo.Delete(ctx, chat.ID); err != nil {
		log.Error("failed to delete chat", zap.Int64("chat_id", chat.ID), zap.Error(err))
		return err
	}

	log.Info("chat deleted successfully", zap.Int64("chat_id", chat.ID))
	return nil
}

var _ IChatService = (*ChatService)(nil)

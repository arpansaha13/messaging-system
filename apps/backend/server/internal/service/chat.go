package service

import (
	"context"
	"sort"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"go.uber.org/zap"
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

// CreateChat creates a new chat between the authenticated user and another user
func (s *ChatService) CreateChat(ctx context.Context, req *dto.CreateChatDTO) (*domain.Chat, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("creating chat", zap.Int64("user_1_id", userID), zap.Int64("user_2_id", req.ReceiverID))

	// Check if chat already exists
	existing, err := s.chatRepo.GetByUsers(ctx, userID, req.ReceiverID)
	if err != nil {
		log.Error("failed to check existing chat", zap.Int64("user_1_id", userID), zap.Int64("user_2_id", req.ReceiverID), zap.Error(err))
		return nil, err
	}

	if existing != nil {
		log.Debug("chat already exists", zap.Int64("chat_id", existing.ID))
		return existing, nil
	}

	chat := &domain.Chat{
		SenderID:   userID,
		ReceiverID: req.ReceiverID,
	}

	if err := s.chatRepo.Create(ctx, chat); err != nil {
		log.Error("failed to create chat in repository", zap.Int64("user_1_id", userID), zap.Int64("user_2_id", req.ReceiverID), zap.Error(err))
		return nil, err
	}

	log.Info("chat created successfully", zap.Int64("chat_id", chat.ID))
	return chat, nil
}

// GetUserUnarchivedChats retrieves all unarchived chats for the authenticated user
func (s *ChatService) GetUserUnarchivedChats(ctx context.Context) ([]*ChatItemDTO, error) {
	return s.getUserChatsByArchivedStatus(ctx, false)
}

// GetUserArchivedChats retrieves all archived chats for the authenticated user
func (s *ChatService) GetUserArchivedChats(ctx context.Context) ([]*ChatItemDTO, error) {
	return s.getUserChatsByArchivedStatus(ctx, true)
}

func (s *ChatService) getUserChatsByArchivedStatus(ctx context.Context, archived bool) ([]*ChatItemDTO, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("retrieving user chats", zap.Int64("user_id", userID), zap.Bool("archived", archived))

	chats, err := s.chatRepo.GetUserChatsByArchived(ctx, userID, archived)
	if err != nil {
		log.Error("failed to retrieve user chats", zap.Int64("user_id", userID), zap.Bool("archived", archived), zap.Error(err))
		return nil, err
	}

	items := make([]*ChatItemDTO, 0, len(chats))

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

	for _, chat := range chats {
		latestMsg, err := s.messageRepo.GetLatestMessageByUsersInChat(ctx, userID, chat.ReceiverID, chat.ClearedAt)
		if err != nil {
			if _, isNotFound := err.(*gtk.NotFoundError); isNotFound {
				log.Debug("no latest message found for chat", zap.Int64("chat_id", chat.ID))
			} else {
				log.Warn("failed to get latest message for chat", zap.Int64("chat_id", chat.ID), zap.Error(err))
			}
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

		items = append(items, item)
	}

	sortChats(items)

	log.Debug("user chats retrieved successfully", zap.Int64("user_id", userID), zap.Bool("archived", archived), zap.Int("total_chats", len(chats)))
	return items, nil
}

// sortChats sorts chats by pinned status, then by latest message timestamp
func sortChats(items []*ChatItemDTO) {
	sort.Slice(items, func(i, j int) bool {
		a, b := items[i], items[j]

		if a.Chat.Pinned && !b.Chat.Pinned {
			return true
		}
		if !a.Chat.Pinned && b.Chat.Pinned {
			return false
		}

		if a.LatestMsg == nil && b.LatestMsg == nil {
			return false
		}
		if b.LatestMsg == nil {
			return true
		}
		if a.LatestMsg == nil {
			return false
		}

		return a.LatestMsg.CreatedAt.After(b.LatestMsg.CreatedAt)
	})
}

// PinChat pins a chat for the authenticated user
func (s *ChatService) PinChat(ctx context.Context, req *dto.PinChatDTO) error {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("pinning chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID))

	chat, err := s.chatRepo.GetByUsers(ctx, userID, req.ReceiverID)
	if err != nil {
		log.Error("failed to get chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
		return err
	}

	if chat == nil {
		log.Warn("chat not found", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID))
		return &gtk.NotFoundError{Message: "chat not found"}
	}

	chat.Pinned = true
	chat.Archived = false

	if err := s.chatRepo.Update(ctx, chat); err != nil {
		log.Error("failed to pin chat", zap.Int64("chat_id", chat.ID), zap.Error(err))
		return err
	}

	log.Info("chat pinned successfully", zap.Int64("chat_id", chat.ID))
	return nil
}

// UnpinChat unpins a chat for the authenticated user
func (s *ChatService) UnpinChat(ctx context.Context, req *dto.UnpinChatDTO) error {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("unpinning chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID))

	chat, err := s.chatRepo.GetByUsers(ctx, userID, req.ReceiverID)
	if err != nil {
		log.Error("failed to get chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
		return err
	}

	if chat == nil {
		log.Warn("chat not found", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID))
		return &gtk.NotFoundError{Message: "chat not found"}
	}

	chat.Pinned = false

	if err := s.chatRepo.Update(ctx, chat); err != nil {
		log.Error("failed to unpin chat", zap.Int64("chat_id", chat.ID), zap.Error(err))
		return err
	}

	log.Info("chat unpinned successfully", zap.Int64("chat_id", chat.ID))
	return nil
}

// ArchiveChat archives a chat for the authenticated user
func (s *ChatService) ArchiveChat(ctx context.Context, req *dto.ArchiveChatDTO) error {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("archiving chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID))

	chat, err := s.chatRepo.GetByUsers(ctx, userID, req.ReceiverID)
	if err != nil {
		log.Error("failed to get chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
		return err
	}

	if chat == nil {
		log.Warn("chat not found", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID))
		return &gtk.NotFoundError{Message: "chat not found"}
	}

	chat.Archived = true
	chat.Pinned = false

	if err := s.chatRepo.Update(ctx, chat); err != nil {
		log.Error("failed to archive chat", zap.Int64("chat_id", chat.ID), zap.Error(err))
		return err
	}

	log.Info("chat archived successfully", zap.Int64("chat_id", chat.ID))
	return nil
}

// UnarchiveChat unarchives a chat for the authenticated user
func (s *ChatService) UnarchiveChat(ctx context.Context, req *dto.UnarchiveChatDTO) error {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("unarchiving chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID))

	chat, err := s.chatRepo.GetByUsers(ctx, userID, req.ReceiverID)
	if err != nil {
		log.Error("failed to get chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
		return err
	}

	if chat == nil {
		log.Warn("chat not found", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID))
		return &gtk.NotFoundError{Message: "chat not found"}
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
func (s *ChatService) ClearChat(ctx context.Context, req *dto.ClearChatDTO) error {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("clearing chat history", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID))

	chat, err := s.chatRepo.GetByUsers(ctx, userID, req.ReceiverID)
	if err != nil {
		log.Error("failed to get chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
		return err
	}

	if chat == nil {
		log.Warn("chat not found", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID))
		return &gtk.NotFoundError{Message: "chat not found"}
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
func (s *ChatService) DeleteChat(ctx context.Context, req *dto.DeleteChatDTO) error {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("deleting chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID))

	chat, err := s.chatRepo.GetByUsers(ctx, userID, req.ReceiverID)
	if err != nil {
		log.Error("failed to get chat", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
		return err
	}

	if chat == nil {
		log.Warn("chat not found", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID))
		return &gtk.NotFoundError{Message: "chat not found"}
	}

	if err := s.chatRepo.Delete(ctx, chat.ID); err != nil {
		log.Error("failed to delete chat", zap.Int64("chat_id", chat.ID), zap.Error(err))
		return err
	}

	log.Info("chat deleted successfully", zap.Int64("chat_id", chat.ID))
	return nil
}

var _ IChatService = (*ChatService)(nil)

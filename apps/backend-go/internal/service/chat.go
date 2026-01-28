package service

import (
	"context"
	"log"
	"sort"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository"
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
	chatRepo    *repository.ChatRepository
	messageRepo *repository.MessageRepository
}

// NewChatService creates a new chat service
func NewChatService(chatRepo *repository.ChatRepository, messageRepo *repository.MessageRepository) *ChatService {
	return &ChatService{
		chatRepo:    chatRepo,
		messageRepo: messageRepo,
	}
}

// CreateChat creates a new chat between two users
func (s *ChatService) CreateChat(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error) {
	// Check if chat already exists
	existing, err := s.chatRepo.GetByUsers(ctx, user1ID, user2ID)
	if err != nil {
		log.Printf("failed to check existing chat: %v", err)
		return nil, err
	}

	if existing != nil {
		return existing, nil
	}

	chat := &domain.Chat{
		SenderID:   user1ID,
		ReceiverID: user2ID,
	}

	if err := s.chatRepo.Create(ctx, chat); err != nil {
		log.Printf("failed to create chat: %v", err)
		return nil, err
	}

	return chat, nil
}

// GetUserChats retrieves all chats for a user split into archived and unarchived
func (s *ChatService) GetUserChats(ctx context.Context, userID int64) (*ChatsResponseDTO, error) {
	chats, err := s.chatRepo.GetUserChats(ctx, userID)
	if err != nil {
		log.Printf("failed to get user chats: %v", err)
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
			log.Printf("failed to get latest message: %v", err)
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
	chat, err := s.chatRepo.GetByUsers(ctx, userID, receiverID)
	if err != nil {
		log.Printf("failed to get chat: %v", err)
		return err
	}

	if chat == nil {
		return &domain.NotFoundError{Message: "chat not found"}
	}

	chat.Pinned = true
	chat.Archived = false // Unarchive when pinning

	if err := s.chatRepo.Update(ctx, chat); err != nil {
		log.Printf("failed to pin chat: %v", err)
		return err
	}

	return nil
}

// Unpin unpins a chat for a user
func (s *ChatService) UnpinChat(ctx context.Context, userID, receiverID int64) error {
	chat, err := s.chatRepo.GetByUsers(ctx, userID, receiverID)
	if err != nil {
		log.Printf("failed to get chat: %v", err)
		return err
	}

	if chat == nil {
		return &domain.NotFoundError{Message: "chat not found"}
	}

	chat.Pinned = false

	if err := s.chatRepo.Update(ctx, chat); err != nil {
		log.Printf("failed to unpin chat: %v", err)
		return err
	}

	return nil
}

// Archive archives a chat for a user
func (s *ChatService) ArchiveChat(ctx context.Context, userID, receiverID int64) error {
	chat, err := s.chatRepo.GetByUsers(ctx, userID, receiverID)
	if err != nil {
		log.Printf("failed to get chat: %v", err)
		return err
	}

	if chat == nil {
		return &domain.NotFoundError{Message: "chat not found"}
	}

	chat.Archived = true
	chat.Pinned = false // Unpin when archiving

	if err := s.chatRepo.Update(ctx, chat); err != nil {
		log.Printf("failed to archive chat: %v", err)
		return err
	}

	return nil
}

// Unarchive unarchives a chat for a user
func (s *ChatService) UnarchiveChat(ctx context.Context, userID, receiverID int64) error {
	chat, err := s.chatRepo.GetByUsers(ctx, userID, receiverID)
	if err != nil {
		log.Printf("failed to get chat: %v", err)
		return err
	}

	if chat == nil {
		return &domain.NotFoundError{Message: "chat not found"}
	}

	chat.Archived = false

	if err := s.chatRepo.Update(ctx, chat); err != nil {
		log.Printf("failed to unarchive chat: %v", err)
		return err
	}

	return nil
}

// ClearChat clears message history for a chat
func (s *ChatService) ClearChat(ctx context.Context, userID, receiverID int64) error {
	chat, err := s.chatRepo.GetByUsers(ctx, userID, receiverID)
	if err != nil {
		log.Printf("failed to get chat: %v", err)
		return err
	}

	if chat == nil {
		return &domain.NotFoundError{Message: "chat not found"}
	}

	now := domain.Now()
	chat.ClearedAt = &now

	if err := s.chatRepo.Update(ctx, chat); err != nil {
		log.Printf("failed to clear chat: %v", err)
		return err
	}

	return nil
}

// DeleteChat deletes a chat
func (s *ChatService) DeleteChat(ctx context.Context, userID, receiverID int64) error {
	chat, err := s.chatRepo.GetByUsers(ctx, userID, receiverID)
	if err != nil {
		log.Printf("failed to get chat: %v", err)
		return err
	}

	if chat == nil {
		return &domain.NotFoundError{Message: "chat not found"}
	}

	if err := s.chatRepo.Delete(ctx, chat.ID); err != nil {
		log.Printf("failed to delete chat: %v", err)
		return err
	}

	return nil
}

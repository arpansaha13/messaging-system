package repository

import (
	"context"
	"errors"
	"time"

	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// ChatWithReceiverInfo holds chat data with receiver user profile info
type ChatWithReceiverInfo struct {
	ID                 int64
	SenderID           int64
	ReceiverID         int64
	Muted              bool
	Pinned             bool
	Archived           bool
	ClearedAt          *time.Time
	CreatedAt          time.Time
	UpdatedAt          time.Time
	ReceiverID_pk      int64 // Receiver's user ID
	ReceiverDP         *string
	ReceiverBio        string
	ReceiverGlobalName string
}

// ChatRepository handles chat-related database operations
type ChatRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewChatRepository creates a new chat repository
func NewChatRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *ChatRepository {
	return &ChatRepository{db: db, cb: cb}
}

// Create creates a new chat
func (r *ChatRepository) Create(ctx context.Context, chat *domain.Chat) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(chat).Error
	})

	if err != nil {
		return &gotoolkit.InternalError{Message: "failed to create chat", Err: err}
	}
	return nil
}

// GetByID retrieves a chat by ID
func (r *ChatRepository) GetByID(ctx context.Context, chatID int64) (*domain.Chat, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var chat domain.Chat
		err := r.db.WithContext(ctx).Where("id = ?", chatID).First(&chat).Error
		if err != nil {
			return nil, err
		}
		return &chat, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gotoolkit.NotFoundError{Message: "chat not found"}
		}
		return nil, &gotoolkit.InternalError{Message: "failed to get chat", Err: err}
	}

	return result.(*domain.Chat), nil
}

// GetByUsers retrieves a chat between two users
func (r *ChatRepository) GetByUsers(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var chat domain.Chat
		err := r.db.WithContext(ctx).
			Where("(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
				user1ID, user2ID, user2ID, user1ID).
			First(&chat).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, nil // Chat doesn't exist
			}
			return nil, err
		}
		return &chat, nil
	})

	if err != nil {
		return nil, &gotoolkit.InternalError{Message: "failed to get chat", Err: err}
	}

	// If result is nil (chat doesn't exist), return nil
	if result == nil {
		return nil, nil
	}
	return result.(*domain.Chat), nil
}

// GetUserChats retrieves all chats for a user with receiver info
func (r *ChatRepository) GetUserChats(ctx context.Context, userID int64) ([]*ChatWithReceiverInfo, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var chats []*ChatWithReceiverInfo
		err := r.db.WithContext(ctx).
			Model(domain.Chat{}).
			Select("chats.id, chats.sender_id, chats.receiver_id, chats.muted, chats.pinned, chats.archived, chats.cleared_at, chats.created_at, chats.updated_at, user_profiles.id as receiver_id_pk, user_profiles.dp as receiver_dp, user_profiles.bio as receiver_bio, user_profiles.global_name as receiver_global_name").
			Joins("INNER JOIN user_profiles ON user_profiles.id = chats.receiver_id").
			Where("chats.sender_id = ?", userID).
			Order("chats.created_at DESC").
			Find(&chats).Error
		if err != nil {
			return nil, err
		}
		return chats, nil
	})

	if err != nil {
		return nil, &gotoolkit.InternalError{Message: "failed to get chats", Err: err}
	}

	return result.([]*ChatWithReceiverInfo), nil
}

// Delete deletes a chat
func (r *ChatRepository) Delete(ctx context.Context, chatID int64) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Delete(&domain.Chat{}, chatID).Error
	})

	if err != nil {
		return &gotoolkit.InternalError{Message: "failed to delete chat", Err: err}
	}
	return nil
}

// Update updates a chat
func (r *ChatRepository) Update(ctx context.Context, chat *domain.Chat) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Save(chat).Error
	})

	if err != nil {
		return &gotoolkit.InternalError{Message: "failed to update chat", Err: err}
	}
	return nil
}

var _ IChatRepository = (*ChatRepository)(nil)

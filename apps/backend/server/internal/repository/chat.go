package repository

import (
	"context"
	"errors"
	"time"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"
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
		return &gtk.InternalError{Message: "failed to create chat", Err: err}
	}
	return nil
}

// FirstOrCreate retrieves a chat matching sender and receiver or creates it if not found
func (r *ChatRepository) FirstOrCreate(ctx context.Context, tx *gorm.DB, chat *domain.Chat) error {
	db := r.db
	if tx != nil {
		db = tx
	}
	_, err := r.cb.Execute(func() (any, error) {
		return nil, db.WithContext(ctx).FirstOrCreate(chat, domain.Chat{SenderID: chat.SenderID, ReceiverID: chat.ReceiverID}).Error
	})

	if err != nil {
		return &gtk.InternalError{Message: "failed to first or create chat", Err: err}
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
			return nil, &gtk.NotFoundError{Message: "chat not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get chat", Err: err}
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
		return nil, &gtk.InternalError{Message: "failed to get chat", Err: err}
	}

	// If result is nil (chat doesn't exist), return nil
	if result == nil {
		return nil, nil
	}
	return result.(*domain.Chat), nil
}

// GetUserChatsByArchived retrieves chats for a user with receiver info filtered by archived status
func (r *ChatRepository) GetUserChatsByArchived(ctx context.Context, userID int64, archived bool) ([]*ChatWithReceiverInfo, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var chats []*ChatWithReceiverInfo
		err := r.db.WithContext(ctx).
			Model(domain.Chat{}).
			Select("chats.id, chats.sender_id, chats.receiver_id, chats.muted, chats.pinned, chats.archived, chats.cleared_at, chats.created_at, chats.updated_at, user_profiles.id as receiver_id_pk, user_profiles.dp as receiver_dp, user_profiles.bio as receiver_bio, user_profiles.global_name as receiver_global_name").
			Joins("INNER JOIN user_profiles ON user_profiles.id = chats.receiver_id").
			Where("chats.sender_id = ? AND chats.archived = ?", userID, archived).
			Order("chats.created_at DESC").
			Find(&chats).Error
		if err != nil {
			return nil, err
		}
		return chats, nil
	})

	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to get chats", Err: err}
	}

	return result.([]*ChatWithReceiverInfo), nil
}

// Delete deletes a chat
func (r *ChatRepository) Delete(ctx context.Context, chatID int64) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Delete(&domain.Chat{}, chatID).Error
	})

	if err != nil {
		return &gtk.InternalError{Message: "failed to delete chat", Err: err}
	}
	return nil
}

// Update updates a chat
func (r *ChatRepository) Update(ctx context.Context, chat *domain.Chat) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Save(chat).Error
	})

	if err != nil {
		return &gtk.InternalError{Message: "failed to update chat", Err: err}
	}
	return nil
}

var _ IChatRepository = (*ChatRepository)(nil)

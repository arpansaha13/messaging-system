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

// MessageWithStatus holds message data with delivery status from message_recipient
type MessageWithStatus struct {
	ID        int64
	SenderID  int64
	Content   string
	Status    domain.MessageStatus
	CreatedAt time.Time
	UpdatedAt time.Time
}

// MessagePage holds paginated personal messages with pagination info
type MessagePage struct {
	Messages  []*MessageWithStatus
	HasBefore bool
	HasAfter  bool
}

// ChannelMessagePage holds paginated channel messages with pagination info
type ChannelMessagePage struct {
	Messages  []*domain.Message
	HasBefore bool
	HasAfter  bool
}

// MessageRepository handles message-related database operations
type MessageRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewMessageRepository creates a new message repository
func NewMessageRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *MessageRepository {
	return &MessageRepository{db: db, cb: cb}
}

// Create creates a new message
func (r *MessageRepository) Create(ctx context.Context, message *domain.Message) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(message).Error
	})

	if err != nil {
		return &gotoolkit.InternalError{Message: "failed to create message", Err: err}
	}
	return nil
}

// GetByID retrieves a message by ID
func (r *MessageRepository) GetByID(ctx context.Context, messageID int64) (*domain.Message, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var message domain.Message
		err := r.db.WithContext(ctx).Where("id = ?", messageID).First(&message).Error
		if err != nil {
			return nil, err
		}
		return &message, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gotoolkit.NotFoundError{Message: "message not found"}
		}
		return nil, &gotoolkit.InternalError{Message: "failed to get message", Err: err}
	}

	return result.(*domain.Message), nil
}

// GetMessagesByUserId retrieves messages between two users using cursor-based pagination.
// `before` and `after` are optional message IDs for pagination; if neither is provided, returns latest messages
func (r *MessageRepository) GetMessagesByUserId(ctx context.Context, senderID, receiverID int64, clearedAt *time.Time, before, after *int64) (*MessagePage, error) {
	result, err := r.cb.Execute(func() (any, error) {
		pageSize := 50
		fetchSize := pageSize + 1 // N+1 trick to detect if more messages exist

		var messages []*MessageWithStatus
		query := r.db.WithContext(ctx).
			Model(domain.Message{}).
			Select("DISTINCT messages.id, messages.sender_id, messages.content, messages.created_at, messages.updated_at, message_recipients.status").
			Joins("INNER JOIN message_recipients ON message_recipients.message_id = messages.id").
			Where("messages.channel_id IS NULL").
			Where("((messages.sender_id = ? AND message_recipients.receiver_id = ?) OR (messages.sender_id = ? AND message_recipients.receiver_id = ?))",
				senderID, receiverID, receiverID, senderID)

		if clearedAt != nil {
			query = query.Where("messages.created_at >= ?", clearedAt)
		}

		var hasBeforeMore, hasAfterMore bool

		// Apply cursor-based filtering
		if before != nil {
			// Load older messages (before this message)
			err := query.
				Where("messages.id < ?", *before).
				Order("messages.id DESC").
				Limit(fetchSize).
				Find(&messages).Error

			if err != nil {
				return nil, err
			}

			// Check if there are more messages before
			hasBeforeMore = len(messages) > pageSize
			if hasBeforeMore {
				messages = messages[:pageSize]
			}
			// Reverse to get chronological order
			for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
				messages[i], messages[j] = messages[j], messages[i]
			}

			return &MessagePage{
				Messages:  messages,
				HasBefore: hasBeforeMore,
				HasAfter:  true, // Cursor message exists upstream
			}, nil
		} else if after != nil {
			// Load newer messages (after this message)
			err := query.
				Where("messages.id > ?", *after).
				Order("messages.id ASC").
				Limit(fetchSize).
				Find(&messages).Error

			if err != nil {
				return nil, err
			}

			// Check if there are more messages after
			hasAfterMore = len(messages) > pageSize
			if hasAfterMore {
				messages = messages[:pageSize]
			}

			return &MessagePage{
				Messages:  messages,
				HasBefore: true, // Cursor message exists downstream
				HasAfter:  hasAfterMore,
			}, nil
		} else {
			// Return latest messages (no cursor)
			err := query.
				Order("messages.id DESC").
				Limit(fetchSize).
				Find(&messages).Error

			if err != nil {
				return nil, err
			}

			// Check if there are more messages before latest
			hasBeforeMore = len(messages) > pageSize
			if hasBeforeMore {
				messages = messages[:pageSize]
			}
			// Reverse to get chronological order
			for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
				messages[i], messages[j] = messages[j], messages[i]
			}

			return &MessagePage{
				Messages:  messages,
				HasBefore: hasBeforeMore,
				HasAfter:  false, // Latest fetch has no newer messages
			}, nil
		}
	})

	if err != nil {
		return nil, &gotoolkit.InternalError{Message: "failed to get messages", Err: err}
	}

	return result.(*MessagePage), nil
}

// Delete deletes a message
func (r *MessageRepository) Delete(ctx context.Context, messageID int64) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Delete(&domain.Message{}, messageID).Error
	})

	if err != nil {
		return &gotoolkit.InternalError{Message: "failed to delete message", Err: err}
	}
	return nil
}

// Update updates a message
func (r *MessageRepository) Update(ctx context.Context, message *domain.Message) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Save(message).Error
	})

	if err != nil {
		return &gotoolkit.InternalError{Message: "failed to update message", Err: err}
	}
	return nil
}

// GetLatestMessageByUsersInChat retrieves the latest message between two users for a specific chat
func (r *MessageRepository) GetLatestMessageByUsersInChat(ctx context.Context, userID, receiverID int64, clearedAt *time.Time) (*MessageWithStatus, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var message *MessageWithStatus
		query := r.db.WithContext(ctx).
			Model(domain.Message{}).
			Select("DISTINCT messages.id, messages.sender_id, messages.content, messages.created_at, messages.updated_at, message_recipients.status").
			Joins("INNER JOIN message_recipients ON message_recipients.message_id = messages.id").
			Where("messages.channel_id IS NULL").
			Where("((messages.sender_id = ? AND message_recipients.receiver_id = ?) OR (messages.sender_id = ? AND message_recipients.receiver_id = ?))",
				userID, receiverID, receiverID, userID)

		if clearedAt != nil {
			query = query.Where("messages.created_at >= ?", clearedAt)
		}

		err := query.
			Order("messages.created_at DESC").
			First(&message).Error

		if err != nil {
			return nil, err
		}

		return message, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // No message found
		}
		return nil, &gotoolkit.InternalError{Message: "failed to get latest message", Err: err}
	}

	return result.(*MessageWithStatus), nil
}

// GetMessagesByChannelID retrieves channel messages using cursor-based pagination
// before and after are optional message IDs for pagination; if neither is provided, returns latest messages
func (r *MessageRepository) GetMessagesByChannelID(ctx context.Context, channelID int64, before, after *int64) (*ChannelMessagePage, error) {
	result, err := r.cb.Execute(func() (any, error) {
		pageSize := 50
		fetchSize := pageSize + 1 // N+1 trick to detect if more messages exist

		var messages []*domain.Message

		query := r.db.WithContext(ctx).Where("channel_id = ?", channelID)

		var hasBeforeMore, hasAfterMore bool

		// Apply cursor-based filtering
		if before != nil {
			// Load older messages (before this message)
			err := query.
				Where("id < ?", *before).
				Order("id DESC").
				Limit(fetchSize).
				Find(&messages).Error

			if err != nil {
				return nil, err
			}

			// Check if there are more messages before
			hasBeforeMore = len(messages) > pageSize
			if hasBeforeMore {
				messages = messages[:pageSize]
			}
			// Reverse to get chronological order
			for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
				messages[i], messages[j] = messages[j], messages[i]
			}

			return &ChannelMessagePage{
				Messages:  messages,
				HasBefore: hasBeforeMore,
				HasAfter:  true, // Cursor message exists upstream
			}, nil
		} else if after != nil {
			// Load newer messages (after this message)
			err := query.
				Where("id > ?", *after).
				Order("id ASC").
				Limit(fetchSize).
				Find(&messages).Error

			if err != nil {
				return nil, err
			}

			// Check if there are more messages after
			hasAfterMore = len(messages) > pageSize
			if hasAfterMore {
				messages = messages[:pageSize]
			}

			return &ChannelMessagePage{
				Messages:  messages,
				HasBefore: true, // Cursor message exists downstream
				HasAfter:  hasAfterMore,
			}, nil
		} else {
			// Initial fetch: return latest messages (no cursor)
			err := query.
				Order("id DESC").
				Limit(fetchSize).
				Find(&messages).Error

			if err != nil {
				return nil, err
			}

			// Check if there are more messages before latest
			hasBeforeMore = len(messages) > pageSize
			if hasBeforeMore {
				messages = messages[:pageSize]
			}
			// Reverse to get chronological order
			for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
				messages[i], messages[j] = messages[j], messages[i]
			}

			return &ChannelMessagePage{
				Messages:  messages,
				HasBefore: hasBeforeMore,
				HasAfter:  false, // Latest fetch has no newer messages
			}, nil
		}
	})

	if err != nil {
		return nil, &gotoolkit.InternalError{Message: "failed to get channel messages", Err: err}
	}

	return result.(*ChannelMessagePage), nil
}

var _ IMessageRepository = (*MessageRepository)(nil)

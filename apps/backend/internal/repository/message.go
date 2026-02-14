package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

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

// MessageRepository handles message-related database operations
type MessageRepository struct {
	db *gorm.DB
}

// NewMessageRepository creates a new message repository
func NewMessageRepository(db *gorm.DB) *MessageRepository {
	return &MessageRepository{db: db}
}

// Create creates a new message
func (r *MessageRepository) Create(ctx context.Context, message *domain.Message) error {
	if err := r.db.WithContext(ctx).Create(message).Error; err != nil {
		return &domain.InternalError{Message: "failed to create message", Err: err}
	}
	return nil
}

// GetByID retrieves a message by ID
func (r *MessageRepository) GetByID(ctx context.Context, messageID int64) (*domain.Message, error) {
	var message domain.Message
	err := r.db.WithContext(ctx).Where("id = ?", messageID).First(&message).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &domain.NotFoundError{Message: "message not found"}
		}
		return nil, &domain.InternalError{Message: "failed to get message", Err: err}
	}

	return &message, nil
}

// GetMessagesByUserId retrieves messages between two users using message_recipients join
func (r *MessageRepository) GetMessagesByUserId(ctx context.Context, senderID, receiverID int64, clearedAt *time.Time, limit int, offset int) ([]*MessageWithStatus, error) {
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

	err := query.
		Order("messages.created_at ASC").
		// Limit(limit).
		// Offset(offset).
		Find(&messages).Error

	if err != nil {
		return nil, &domain.InternalError{Message: "failed to get messages", Err: err}
	}

	return messages, nil
}

// Delete deletes a message
func (r *MessageRepository) Delete(ctx context.Context, messageID int64) error {
	if err := r.db.WithContext(ctx).Delete(&domain.Message{}, messageID).Error; err != nil {
		return &domain.InternalError{Message: "failed to delete message", Err: err}
	}
	return nil
}

// Update updates a message
func (r *MessageRepository) Update(ctx context.Context, message *domain.Message) error {
	if err := r.db.WithContext(ctx).Save(message).Error; err != nil {
		return &domain.InternalError{Message: "failed to update message", Err: err}
	}
	return nil
}

// GetLatestMessageByUsersInChat retrieves the latest message between two users for a specific chat
func (r *MessageRepository) GetLatestMessageByUsersInChat(ctx context.Context, userID, receiverID int64, clearedAt *time.Time) (*MessageWithStatus, error) {
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
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // No message found
		}
		return nil, &domain.InternalError{Message: "failed to get latest message", Err: err}
	}

	return message, nil
}

// GetMessagesByChannelID retrieves all messages in a channel
func (r *MessageRepository) GetMessagesByChannelID(ctx context.Context, channelID int64, limit int, offset int) ([]*domain.Message, error) {
	var messages []*domain.Message
	err := r.db.WithContext(ctx).
		Where("channel_id = ?", channelID).
		Order("created_at ASC").
		// Limit(limit).
		// Offset(offset).
		Find(&messages).Error

	if err != nil {
		return nil, &domain.InternalError{Message: "failed to get channel messages", Err: err}
	}

	return messages, nil
}

var _ IMessageRepository = (*MessageRepository)(nil)

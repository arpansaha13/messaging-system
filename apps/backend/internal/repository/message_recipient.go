package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// MessageRecipientRepository handles message recipient-related database operations
type MessageRecipientRepository struct {
	db *gorm.DB
}

// NewMessageRecipientRepository creates a new message recipient repository
func NewMessageRecipientRepository(db *gorm.DB) *MessageRecipientRepository {
	return &MessageRecipientRepository{db: db}
}

// Create creates a new message recipient record
func (r *MessageRecipientRepository) Create(ctx context.Context, recipient *domain.MessageRecipient) error {
	if err := r.db.WithContext(ctx).Create(recipient).Error; err != nil {
		return &gotoolkit.InternalError{Message: "failed to create message recipient", Err: err}
	}
	return nil
}

// GetByID retrieves a message recipient by ID
func (r *MessageRecipientRepository) GetByID(ctx context.Context, recipientID int64) (*domain.MessageRecipient, error) {
	var recipient domain.MessageRecipient
	err := r.db.WithContext(ctx).Where("id = ?", recipientID).First(&recipient).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gotoolkit.NotFoundError{Message: "message recipient not found"}
		}
		return nil, &gotoolkit.InternalError{Message: "failed to get message recipient", Err: err}
	}

	return &recipient, nil
}

// GetByMessageAndReceiver retrieves a message recipient by message and receiver IDs
func (r *MessageRecipientRepository) GetByMessageAndReceiver(ctx context.Context, messageID, receiverID int64) (*domain.MessageRecipient, error) {
	var recipient domain.MessageRecipient
	err := r.db.WithContext(ctx).
		Where("message_id = ? AND receiver_id = ?", messageID, receiverID).
		First(&recipient).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gotoolkit.NotFoundError{Message: "message recipient not found"}
		}
		return nil, &gotoolkit.InternalError{Message: "failed to get message recipient", Err: err}
	}

	return &recipient, nil
}

// GetByMessageID retrieves all recipients for a message
func (r *MessageRecipientRepository) GetByMessageID(ctx context.Context, messageID int64) ([]*domain.MessageRecipient, error) {
	var recipients []*domain.MessageRecipient
	err := r.db.WithContext(ctx).
		Where("message_id = ?", messageID).
		Find(&recipients).Error

	if err != nil {
		return nil, &gotoolkit.InternalError{Message: "failed to get message recipients", Err: err}
	}

	return recipients, nil
}

// UpdateStatus updates the status of a message recipient
func (r *MessageRecipientRepository) UpdateStatus(ctx context.Context, recipientID int64, status domain.MessageStatus) error {
	if err := r.db.WithContext(ctx).
		Model(&domain.MessageRecipient{}).
		Where("id = ?", recipientID).
		Update("status", status).Error; err != nil {
		return &gotoolkit.InternalError{Message: "failed to update message recipient status", Err: err}
	}
	return nil
}

// UpdateStatusByMessageAndReceiver updates the status of a message recipient by message and receiver
func (r *MessageRecipientRepository) UpdateStatusByMessageAndReceiver(ctx context.Context, messageID, receiverID int64, status domain.MessageStatus) error {
	if err := r.db.WithContext(ctx).
		Model(&domain.MessageRecipient{}).
		Where("message_id = ? AND receiver_id = ?", messageID, receiverID).
		Update("status", status).Error; err != nil {
		return &gotoolkit.InternalError{Message: "failed to update message recipient status", Err: err}
	}
	return nil
}

// Delete deletes a message recipient record
func (r *MessageRecipientRepository) Delete(ctx context.Context, recipientID int64) error {
	if err := r.db.WithContext(ctx).Delete(&domain.MessageRecipient{}, recipientID).Error; err != nil {
		return &gotoolkit.InternalError{Message: "failed to delete message recipient", Err: err}
	}
	return nil
}

var _ IMessageRecipientRepository = (*MessageRecipientRepository)(nil)

package repository

import (
	"context"
	"errors"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"
)

// MessageRecipientRepository handles message recipient-related database operations
type MessageRecipientRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewMessageRecipientRepository creates a new message recipient repository
func NewMessageRecipientRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *MessageRecipientRepository {
	return &MessageRecipientRepository{db: db, cb: cb}
}

// Create creates a new message recipient record
func (r *MessageRecipientRepository) Create(ctx context.Context, recipient *domain.MessageRecipient) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(recipient).Error
	})

	if err != nil {
		return &gtk.InternalError{Message: "failed to create message recipient", Err: err}
	}
	return nil
}

// GetByID retrieves a message recipient by ID
func (r *MessageRecipientRepository) GetByID(ctx context.Context, recipientID int64) (*domain.MessageRecipient, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var recipient domain.MessageRecipient
		err := r.db.WithContext(ctx).Where("id = ?", recipientID).First(&recipient).Error
		if err != nil {
			return nil, err
		}
		return &recipient, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "message recipient not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get message recipient", Err: err}
	}

	return result.(*domain.MessageRecipient), nil
}

// GetByMessageAndReceiver retrieves a message recipient by message and receiver IDs
func (r *MessageRecipientRepository) GetByMessageAndReceiver(ctx context.Context, messageID, receiverID int64) (*domain.MessageRecipient, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var recipient domain.MessageRecipient
		err := r.db.WithContext(ctx).
			Where("message_id = ? AND receiver_id = ?", messageID, receiverID).
			First(&recipient).Error
		if err != nil {
			return nil, err
		}
		return &recipient, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "message recipient not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get message recipient", Err: err}
	}

	return result.(*domain.MessageRecipient), nil
}

// GetByMessageID retrieves all recipients for a message
func (r *MessageRecipientRepository) GetByMessageID(ctx context.Context, messageID int64) ([]*domain.MessageRecipient, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var recipients []*domain.MessageRecipient
		err := r.db.WithContext(ctx).
			Where("message_id = ?", messageID).
			Find(&recipients).Error
		if err != nil {
			return nil, err
		}
		return recipients, nil
	})

	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to get message recipients", Err: err}
	}

	return result.([]*domain.MessageRecipient), nil
}

// UpdateStatus updates the status of a message recipient
func (r *MessageRecipientRepository) UpdateStatus(ctx context.Context, recipientID int64, status domain.MessageStatus) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).
			Model(&domain.MessageRecipient{}).
			Where("id = ?", recipientID).
			Update("status", status).Error
	})

	if err != nil {
		return &gtk.InternalError{Message: "failed to update message recipient status", Err: err}
	}
	return nil
}

// UpdateStatusByMessageAndReceiver updates the status of a message recipient by message and receiver
func (r *MessageRecipientRepository) UpdateStatusByMessageAndReceiver(ctx context.Context, messageID, receiverID int64, status domain.MessageStatus) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).
			Model(&domain.MessageRecipient{}).
			Where("message_id = ? AND receiver_id = ?", messageID, receiverID).
			Update("status", status).Error
	})

	if err != nil {
		return &gtk.InternalError{Message: "failed to update message recipient status", Err: err}
	}
	return nil
}

// Delete deletes a message recipient record
func (r *MessageRecipientRepository) Delete(ctx context.Context, recipientID int64) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Delete(&domain.MessageRecipient{}, recipientID).Error
	})

	if err != nil {
		return &gtk.InternalError{Message: "failed to delete message recipient", Err: err}
	}
	return nil
}

// GetByMessageIDsAndReceiver retrieves message recipients for multiple messages by a given receiver
func (r *MessageRecipientRepository) GetByMessageIDsAndReceiver(ctx context.Context, messageIDs []int64, receiverID int64) ([]*domain.MessageRecipient, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var recipients []*domain.MessageRecipient
		err := r.db.WithContext(ctx).
			Where("message_id IN ? AND receiver_id = ?", messageIDs, receiverID).
			Find(&recipients).Error
		if err != nil {
			return nil, err
		}
		return recipients, nil
	})

	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to get message recipients by message IDs and receiver", Err: err}
	}

	return result.([]*domain.MessageRecipient), nil
}

var _ IMessageRecipientRepository = (*MessageRecipientRepository)(nil)

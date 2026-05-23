package repository

import (
	"context"
	"errors"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"
)

// IContactRepository defines the interface for contact repository operations
type IContactRepository interface {
	Create(ctx context.Context, contact *domain.Contact) error
	GetByID(ctx context.Context, contactID int64) (*domain.Contact, error)
	GetUserContacts(ctx context.Context, userID int64) ([]*domain.Contact, error)
	Exists(ctx context.Context, userID, contactID int64) (bool, error)
	UpdateAlias(ctx context.Context, contactID int64, alias string) error
	Delete(ctx context.Context, contactID int64) error
	GetContactByUserIds(ctx context.Context, userID, contactUserID int64) (*domain.Contact, error)
}

// ContactRepository handles contact-related database operations
type ContactRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewContactRepository creates a new contact repository
func NewContactRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *ContactRepository {
	return &ContactRepository{db: db, cb: cb}
}

// Create creates a new contact
func (r *ContactRepository) Create(ctx context.Context, contact *domain.Contact) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(contact).Error
	})
	if err != nil {
		return &gtk.InternalError{Message: "failed to create contact", Err: err}
	}
	return nil
}

// GetByID retrieves a contact by ID
func (r *ContactRepository) GetByID(ctx context.Context, contactID int64) (*domain.Contact, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var contact domain.Contact
		err := r.db.WithContext(ctx).Where("id = ?", contactID).First(&contact).Error
		if err != nil {
			return nil, err
		}
		return &contact, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "contact not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get contact", Err: err}
	}
	return result.(*domain.Contact), nil
}

// GetUserContacts retrieves all contacts for a user
func (r *ContactRepository) GetUserContacts(ctx context.Context, userID int64) ([]*domain.Contact, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var contacts []*domain.Contact
		err := r.db.WithContext(ctx).
			Where("user_id = ?", userID).
			Find(&contacts).Error
		if err != nil {
			return nil, err
		}
		return contacts, nil
	})

	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to get contacts", Err: err}
	}
	return result.([]*domain.Contact), nil
}

// Exists checks if a contact exists
func (r *ContactRepository) Exists(ctx context.Context, userID, contactID int64) (bool, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var count int64
		err := r.db.WithContext(ctx).
			Model(&domain.Contact{}).
			Where("user_id = ? AND user_id_in_contact = ?", userID, contactID).
			Count(&count).Error
		if err != nil {
			return nil, err
		}
		return count > 0, nil
	})

	if err != nil {
		return false, &gtk.InternalError{Message: "failed to check contact", Err: err}
	}
	return result.(bool), nil
}

// UpdateAlias updates a contact alias
func (r *ContactRepository) UpdateAlias(ctx context.Context, contactID int64, alias string) error {
	_, err := r.cb.Execute(func() (any, error) {
		result := r.db.WithContext(ctx).
			Model(&domain.Contact{}).
			Where("id = ?", contactID).
			Update("alias", alias)
		if result.Error != nil {
			return nil, result.Error
		}
		if result.RowsAffected == 0 {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, nil
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &gtk.NotFoundError{Message: "contact not found"}
		}
		return &gtk.InternalError{Message: "failed to update contact alias", Err: err}
	}
	return nil
}

// Delete deletes a contact
func (r *ContactRepository) Delete(ctx context.Context, contactID int64) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Delete(&domain.Contact{}, contactID).Error
	})
	if err != nil {
		return &gtk.InternalError{Message: "failed to delete contact", Err: err}
	}
	return nil
}

// GetContactByUserIds retrieves a contact between two users
func (r *ContactRepository) GetContactByUserIds(ctx context.Context, userID, contactUserID int64) (*domain.Contact, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var contact domain.Contact
		err := r.db.WithContext(ctx).
			Where("user_id = ? AND user_id_in_contact = ?", userID, contactUserID).
			First(&contact).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, nil // Contact doesn't exist
			}
			return nil, err
		}
		return &contact, nil
	})

	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to get contact", Err: err}
	}
	if result == nil {
		return nil, nil
	}
	return result.(*domain.Contact), nil
}

var _ IContactRepository = (*ContactRepository)(nil)

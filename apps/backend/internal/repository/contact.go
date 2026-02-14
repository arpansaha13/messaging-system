package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// ContactWithUserInfo holds contact data with user profile info
type ContactWithUserInfo struct {
	ID              int64
	UserID          int64
	UserIDInContact int64
	Alias           string
	GlobalName      string
	DP              *string
	Bio             string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// ContactRepository handles contact-related database operations
type ContactRepository struct {
	db *gorm.DB
}

// NewContactRepository creates a new contact repository
func NewContactRepository(db *gorm.DB) *ContactRepository {
	return &ContactRepository{db: db}
}

// Create creates a new contact
func (r *ContactRepository) Create(ctx context.Context, contact *domain.Contact) error {
	if err := r.db.WithContext(ctx).Create(contact).Error; err != nil {
		return &domain.InternalError{Message: "failed to create contact", Err: err}
	}
	return nil
}

// GetByID retrieves a contact by ID
func (r *ContactRepository) GetByID(ctx context.Context, contactID int64) (*domain.Contact, error) {
	var contact domain.Contact
	err := r.db.WithContext(ctx).Where("id = ?", contactID).First(&contact).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &domain.NotFoundError{Message: "contact not found"}
		}
		return nil, &domain.InternalError{Message: "failed to get contact", Err: err}
	}

	return &contact, nil
}

// GetUserContacts retrieves all contacts for a user with their profile info
func (r *ContactRepository) GetUserContacts(ctx context.Context, userID int64) ([]*ContactWithUserInfo, error) {
	var contacts []*ContactWithUserInfo
	err := r.db.WithContext(ctx).
		Table("contacts").
		Select("contacts.id, contacts.user_id, contacts.user_id_in_contact, contacts.alias, user_profiles.global_name, user_profiles.dp, user_profiles.bio, contacts.created_at, contacts.updated_at").
		Joins("INNER JOIN user_profiles ON user_profiles.id = contacts.user_id_in_contact").
		Where("contacts.user_id = ?", userID).
		Find(&contacts).Error

	if err != nil {
		return nil, &domain.InternalError{Message: "failed to get contacts", Err: err}
	}

	return contacts, nil
}

// Exists checks if a contact exists
func (r *ContactRepository) Exists(ctx context.Context, userID, contactID int64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&domain.Contact{}).
		Where("user_id = ? AND contact_id = ?", userID, contactID).
		Count(&count).Error

	if err != nil {
		return false, &domain.InternalError{Message: "failed to check contact", Err: err}
	}

	return count > 0, nil
}

// Delete deletes a contact
func (r *ContactRepository) Delete(ctx context.Context, contactID int64) error {
	if err := r.db.WithContext(ctx).Delete(&domain.Contact{}, contactID).Error; err != nil {
		return &domain.InternalError{Message: "failed to delete contact", Err: err}
	}
	return nil
}

// GetContactByUserIds retrieves a contact between two users
func (r *ContactRepository) GetContactByUserIds(ctx context.Context, userID, contactUserID int64) (*domain.Contact, error) {
	var contact domain.Contact
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND user_id_in_contact = ?", userID, contactUserID).
		First(&contact).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Contact doesn't exist
		}
		return nil, &domain.InternalError{Message: "failed to get contact", Err: err}
	}

	return &contact, nil
}

var _ IContactRepository = (*ContactRepository)(nil)

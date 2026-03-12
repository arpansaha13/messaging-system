package service

import (
	"context"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// ContactService handles contact business logic
type ContactService struct {
	contactRepo repository.IContactRepository
	userRepo    repository.IUserRepository
}

// NewContactService creates a new contact service
func NewContactService(contactRepo repository.IContactRepository, userRepo repository.IUserRepository) *ContactService {
	return &ContactService{
		contactRepo: contactRepo,
		userRepo:    userRepo,
	}
}

// AddContact adds a user to contacts
func (s *ContactService) AddContact(ctx context.Context, userID, userIDInContact int64, alias string) (*domain.Contact, error) {
	log := logger.FromContext(ctx)
	log.Debug("adding contact", zap.Int64("user_id", userID), zap.Int64("contact_user_id", userIDInContact))

	existingContact, err := s.contactRepo.GetContactByUserIds(ctx, userID, userIDInContact)
	if err != nil {
		log.Error("failed to check existing contact", zap.Int64("user_id", userID), zap.Int64("contact_user_id", userIDInContact), zap.Error(err))
		return nil, err
	}
	if existingContact != nil {
		if alias != "" && existingContact.Alias != alias {
			if err := s.contactRepo.UpdateAlias(ctx, existingContact.ID, alias); err != nil {
				log.Error("failed to update existing contact alias", zap.Int64("contact_id", existingContact.ID), zap.Error(err))
				return nil, err
			}
			existingContact.Alias = alias
		}
		return existingContact, nil
	}

	// Verify contact user exists
	contactProfile, err := s.userRepo.GetByID(ctx, userIDInContact)
	if err != nil {
		log.Error("failed to verify contact user existence", zap.Int64("contact_user_id", userIDInContact), zap.Error(err))
		return nil, err
	}

	if alias == "" {
		alias = contactProfile.GlobalName
	}

	contact := &domain.Contact{
		UserID:          userID,
		UserIDInContact: userIDInContact,
		Alias:           alias,
	}

	if err := s.contactRepo.Create(ctx, contact); err != nil {
		log.Error("failed to add contact in repository", zap.Int64("user_id", userID), zap.Int64("contact_user_id", userIDInContact), zap.Error(err))
		return nil, err
	}

	log.Info("contact added successfully", zap.Int64("contact_id", contact.ID), zap.Int64("user_id", userID))
	return contact, nil
}

// GetContacts retrieves user's contacts
func (s *ContactService) GetContacts(ctx context.Context, userID int64) ([]*repository.ContactWithUserInfo, error) {
	log := logger.FromContext(ctx)
	log.Debug("retrieving contacts", zap.Int64("user_id", userID))

	contacts, err := s.contactRepo.GetUserContacts(ctx, userID)
	if err != nil {
		log.Error("failed to retrieve contacts", zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}

	log.Debug("contacts retrieved successfully", zap.Int64("user_id", userID), zap.Int("contact_count", len(contacts)))
	return contacts, nil
}

// UpdateContactAlias updates a contact alias for a user
func (s *ContactService) UpdateContactAlias(ctx context.Context, userID, contactID int64, alias string) (*domain.Contact, error) {
	log := logger.FromContext(ctx)
	log.Debug("updating contact alias", zap.Int64("user_id", userID), zap.Int64("contact_id", contactID))

	contact, err := s.contactRepo.GetByID(ctx, contactID)
	if err != nil {
		log.Error("failed to get contact for update", zap.Int64("contact_id", contactID), zap.Error(err))
		return nil, err
	}
	if contact.UserID != userID {
		return nil, &gotoolkit.NotFoundError{Message: "contact not found"}
	}

	if err := s.contactRepo.UpdateAlias(ctx, contactID, alias); err != nil {
		log.Error("failed to update contact alias", zap.Int64("contact_id", contactID), zap.Error(err))
		return nil, err
	}

	contact.Alias = alias
	return contact, nil
}

// DeleteContact deletes a contact for a user
func (s *ContactService) DeleteContact(ctx context.Context, userID, contactID int64) error {
	log := logger.FromContext(ctx)
	log.Debug("deleting contact", zap.Int64("user_id", userID), zap.Int64("contact_id", contactID))

	contact, err := s.contactRepo.GetByID(ctx, contactID)
	if err != nil {
		log.Error("failed to get contact for delete", zap.Int64("contact_id", contactID), zap.Error(err))
		return err
	}
	if contact.UserID != userID {
		return &gotoolkit.NotFoundError{Message: "contact not found"}
	}

	if err := s.contactRepo.Delete(ctx, contactID); err != nil {
		log.Error("failed to delete contact", zap.Int64("contact_id", contactID), zap.Error(err))
		return err
	}

	return nil
}

var _ IContactService = (*ContactService)(nil)

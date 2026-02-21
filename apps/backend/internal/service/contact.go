package service

import (
	"context"

	"go.uber.org/zap"

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
func (s *ContactService) AddContact(ctx context.Context, userID, userIDInContact int64) (*domain.Contact, error) {
	log := logger.FromContext(ctx)
	log.Debug("adding contact", zap.Int64("user_id", userID), zap.Int64("contact_user_id", userIDInContact))

	// Verify contact user exists
	_, err := s.userRepo.GetByID(ctx, userIDInContact)
	if err != nil {
		log.Error("failed to verify contact user existence", zap.Int64("contact_user_id", userIDInContact), zap.Error(err))
		return nil, err
	}

	contact := &domain.Contact{
		UserID:          userID,
		UserIDInContact: userIDInContact,
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

var _ IContactService = (*ContactService)(nil)

package service

import (
	"context"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/utils"
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
func (s *ContactService) AddContact(ctx context.Context, req *dto.AddContactDTO) (*domain.Contact, error) {
	log := logger.FromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("adding contact", zap.Int64("user_id", userID), zap.Int64("contact_user_id", req.UserIDToAdd))

	existingContact, err := s.contactRepo.GetContactByUserIds(ctx, userID, req.UserIDToAdd)
	if err != nil {
		log.Error("failed to check existing contact", zap.Int64("user_id", userID), zap.Int64("contact_user_id", req.UserIDToAdd), zap.Error(err))
		return nil, err
	}
	if existingContact != nil {
		if req.Alias != "" && existingContact.Alias != req.Alias {
			if err := s.contactRepo.UpdateAlias(ctx, existingContact.ID, req.Alias); err != nil {
				log.Error("failed to update existing contact alias", zap.Int64("contact_id", existingContact.ID), zap.Error(err))
				return nil, err
			}
			existingContact.Alias = req.Alias
		}
		return existingContact, nil
	}

	// Verify contact user exists
	contactProfile, err := s.userRepo.GetByID(ctx, req.UserIDToAdd)
	if err != nil {
		log.Error("failed to verify contact user existence", zap.Int64("contact_user_id", req.UserIDToAdd), zap.Error(err))
		return nil, err
	}

	alias := req.Alias
	if alias == "" {
		alias = contactProfile.GlobalName
	}

	contact := &domain.Contact{
		UserID:          userID,
		UserIDInContact: req.UserIDToAdd,
		Alias:           alias,
	}

	if err := s.contactRepo.Create(ctx, contact); err != nil {
		log.Error("failed to add contact in repository", zap.Int64("user_id", userID), zap.Int64("contact_user_id", req.UserIDToAdd), zap.Error(err))
		return nil, err
	}

	log.Info("contact added successfully", zap.Int64("contact_id", contact.ID), zap.Int64("user_id", userID))
	return contact, nil
}

// GetContacts retrieves the authenticated user's contacts
func (s *ContactService) GetContacts(ctx context.Context) ([]*repository.ContactWithUserInfo, error) {
	log := logger.FromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("retrieving contacts", zap.Int64("user_id", userID))

	contacts, err := s.contactRepo.GetUserContacts(ctx, userID)
	if err != nil {
		log.Error("failed to retrieve contacts", zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}

	log.Debug("contacts retrieved successfully", zap.Int64("user_id", userID), zap.Int("contact_count", len(contacts)))
	return contacts, nil
}

// UpdateContactAlias updates a contact alias for the authenticated user
func (s *ContactService) UpdateContactAlias(ctx context.Context, req *dto.UpdateContactAliasDTO) (*domain.Contact, error) {
	log := logger.FromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("updating contact alias", zap.Int64("user_id", userID), zap.Int64("contact_id", req.ID))

	contact, err := s.contactRepo.GetByID(ctx, req.ID)
	if err != nil {
		log.Error("failed to get contact for update", zap.Int64("contact_id", req.ID), zap.Error(err))
		return nil, err
	}
	if contact.UserID != userID {
		return nil, &gotoolkit.NotFoundError{Message: "contact not found"}
	}

	if err := s.contactRepo.UpdateAlias(ctx, req.ID, req.NewAlias); err != nil {
		log.Error("failed to update contact alias", zap.Int64("contact_id", req.ID), zap.Error(err))
		return nil, err
	}

	contact.Alias = req.NewAlias
	return contact, nil
}

// DeleteContact deletes a contact for the authenticated user
func (s *ContactService) DeleteContact(ctx context.Context, req *dto.DeleteContactDTO) error {
	log := logger.FromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("deleting contact", zap.Int64("user_id", userID), zap.Int64("contact_id", req.ID))

	contact, err := s.contactRepo.GetByID(ctx, req.ID)
	if err != nil {
		log.Error("failed to get contact for delete", zap.Int64("contact_id", req.ID), zap.Error(err))
		return err
	}
	if contact.UserID != userID {
		return &gotoolkit.NotFoundError{Message: "contact not found"}
	}

	if err := s.contactRepo.Delete(ctx, req.ID); err != nil {
		log.Error("failed to delete contact", zap.Int64("contact_id", req.ID), zap.Error(err))
		return err
	}

	return nil
}

var _ IContactService = (*ContactService)(nil)

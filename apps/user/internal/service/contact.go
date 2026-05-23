package service

import (
	"context"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/arpansaha13/messaging-system/apps/user/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/user/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/user/internal/utils"
	"go.uber.org/zap"
)

// IContactService defines the interface for contact service operations
type IContactService interface {
	AddContact(ctx context.Context, req *dto.AddContactDTO) (*domain.Contact, error)
	GetContacts(ctx context.Context) ([]*dto.ContactResponseDTO, error)
	UpdateContactAlias(ctx context.Context, req *dto.UpdateContactAliasDTO) (*domain.Contact, error)
	DeleteContact(ctx context.Context, req *dto.DeleteContactDTO) error
}

type ContactService struct {
	contactRepo repository.IContactRepository
	userRepo    repository.IUserProfileRepository
}

func NewContactService(contactRepo repository.IContactRepository, userRepo repository.IUserProfileRepository) *ContactService {
	return &ContactService{
		contactRepo: contactRepo,
		userRepo:    userRepo,
	}
}

func (s *ContactService) AddContact(ctx context.Context, req *dto.AddContactDTO) (*domain.Contact, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	if userID == req.UserIDToAdd {
		return nil, &gtk.ValidationError{Message: "cannot add yourself as a contact"}
	}
	exists, err := s.contactRepo.Exists(ctx, userID, req.UserIDToAdd)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, &gtk.ConflictError{Message: "contact already exists"}
	}

	// Verify user to add exists
	_, err = s.userRepo.GetByID(ctx, req.UserIDToAdd)
	if err != nil {
		return nil, err
	}

	contact := &domain.Contact{
		UserID:          userID,
		UserIDInContact: req.UserIDToAdd,
		Alias:           req.Alias,
	}

	if err := s.contactRepo.Create(ctx, contact); err != nil {
		log.Error("failed to create contact", zap.Error(err))
		return nil, err
	}

	return contact, nil
}

func (s *ContactService) GetContacts(ctx context.Context) ([]*dto.ContactResponseDTO, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)

	contacts, err := s.contactRepo.GetUserContacts(ctx, userID)
	if err != nil {
		log.Error("failed to get user contacts", zap.Error(err))
		return nil, err
	}

	responses := make([]*dto.ContactResponseDTO, len(contacts))
	for i, c := range contacts {
		profile, err := s.userRepo.GetByID(ctx, c.UserIDInContact)
		if err != nil {
			log.Warn("failed to fetch profile for contact", zap.Int64("contact_user_id", c.UserIDInContact), zap.Error(err))
			responses[i] = &dto.ContactResponseDTO{
				ID:     c.ID,
				Alias:  c.Alias,
				UserID: c.UserIDInContact,
			}
			continue
		}

		responses[i] = &dto.ContactResponseDTO{
			ID:         c.ID,
			Alias:      c.Alias,
			UserID:     c.UserIDInContact,
			GlobalName: profile.GlobalName,
			DP:         profile.DP,
			Bio:        profile.Bio,
		}
	}

	return responses, nil
}

func (s *ContactService) UpdateContactAlias(ctx context.Context, req *dto.UpdateContactAliasDTO) (*domain.Contact, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)

	contact, err := s.contactRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	if contact.UserID != userID {
		return nil, &gtk.ForbiddenError{Message: "forbidden"}
	}

	if err := s.contactRepo.UpdateAlias(ctx, req.ID, req.Alias); err != nil {
		log.Error("failed to update contact alias", zap.Error(err))
		return nil, err
	}

	contact.Alias = req.Alias
	return contact, nil
}

func (s *ContactService) DeleteContact(ctx context.Context, req *dto.DeleteContactDTO) error {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)

	contact, err := s.contactRepo.GetByID(ctx, req.ID)
	if err != nil {
		return err
	}

	if contact.UserID != userID {
		return &gtk.ForbiddenError{Message: "forbidden"}
	}

	if err := s.contactRepo.Delete(ctx, req.ID); err != nil {
		log.Error("failed to delete contact", zap.Error(err))
		return err
	}

	return nil
}

var _ IContactService = (*ContactService)(nil)

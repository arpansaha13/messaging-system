package service

import (
	"context"
	"log"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
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
	// Verify contact user exists
	_, err := s.userRepo.GetByID(ctx, userIDInContact)
	if err != nil {
		log.Printf("failed to verify contact user: %v", err)
		return nil, err
	}

	contact := &domain.Contact{
		UserID:          userID,
		UserIDInContact: userIDInContact,
	}

	if err := s.contactRepo.Create(ctx, contact); err != nil {
		log.Printf("failed to add contact: %v", err)
		return nil, err
	}

	return contact, nil
}

// GetContacts retrieves user's contacts
func (s *ContactService) GetContacts(ctx context.Context, userID int64) ([]*repository.ContactWithUserInfo, error) {
	contacts, err := s.contactRepo.GetUserContacts(ctx, userID)
	if err != nil {
		log.Printf("failed to get contacts: %v", err)
		return nil, err
	}
	return contacts, nil
}

var _ IContactService = (*ContactService)(nil)

package service

import (
	"context"
	"log"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository"
)

// UserService handles user profile business logic
type UserService struct {
	userRepo    *repository.UserRepository
	contactRepo *repository.ContactRepository
}

// NewUserService creates a new user service
func NewUserService(userRepo *repository.UserRepository, contactRepo *repository.ContactRepository) *UserService {
	return &UserService{
		userRepo:    userRepo,
		contactRepo: contactRepo,
	}
}

// GetUserProfile retrieves a user profile by ID
func (s *UserService) GetUserProfile(ctx context.Context, userID int64) (*domain.UserProfile, error) {
	userProfile, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		log.Printf("failed to get user profile: %v", err)
		return nil, err
	}
	return userProfile, nil
}

// SearchUserProfiles searches for user profiles
func (s *UserService) SearchUserProfiles(ctx context.Context, query string) ([]*domain.UserProfile, error) {
	userProfiles, err := s.userRepo.Search(ctx, query, 20)
	if err != nil {
		log.Printf("failed to search user profiles: %v", err)
		return nil, err
	}
	return userProfiles, nil
}

// GetUserProfileWithContact retrieves a user profile with contact info
func (s *UserService) GetUserProfileWithContact(ctx context.Context, authUserID, userID int64) (*domain.UserProfile, *domain.Contact, error) {
	userProfile, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		log.Printf("failed to get user profile: %v", err)
		return nil, nil, err
	}

	contact, err := s.contactRepo.GetContactByUserIds(ctx, authUserID, userID)
	if err != nil {
		log.Printf("failed to get contact: %v", err)
		return nil, nil, err
	}

	return userProfile, contact, nil
}

package service

import (
	"context"
	"log"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository"
)

// UserService handles user profile business logic
type UserService struct {
	userRepo    repository.IUserRepository
	contactRepo repository.IContactRepository
}

// NewUserService creates a new user service
func NewUserService(userRepo repository.IUserRepository, contactRepo repository.IContactRepository) *UserService {
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

// UpdateUserProfile updates a user's profile information
func (s *UserService) UpdateUserProfile(ctx context.Context, userID int64, globalName, bio *string, dp *string) (*domain.UserProfile, error) {
	// Get existing profile
	userProfile, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		log.Printf("failed to get user profile for update: %v", err)
		return nil, err
	}

	// Update fields if provided
	if globalName != nil {
		userProfile.GlobalName = *globalName
	}
	if bio != nil {
		userProfile.Bio = *bio
	}
	if dp != nil {
		userProfile.DP = dp
	}

	// Save updated profile
	if err := s.userRepo.Update(ctx, userProfile); err != nil {
		log.Printf("failed to update user profile: %v", err)
		return nil, err
	}

	return userProfile, nil
}

var _ IUserService = (*UserService)(nil)

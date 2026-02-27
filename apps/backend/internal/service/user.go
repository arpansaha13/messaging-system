package service

import (
	"context"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
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
	log := logger.FromContext(ctx)
	log.Debug("retrieving user profile", zap.Int64("user_id", userID))

	userProfile, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		log.Error("failed to retrieve user profile", zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}

	log.Debug("user profile retrieved successfully", zap.Int64("user_id", userID))
	return userProfile, nil
}

// SearchUserProfiles searches for user profiles
func (s *UserService) SearchUserProfiles(ctx context.Context, query string) ([]*domain.UserProfile, error) {
	log := logger.FromContext(ctx)
	log.Debug("searching user profiles", zap.String("query", query))

	userProfiles, err := s.userRepo.Search(ctx, query, 20)
	if err != nil {
		log.Error("failed to search user profiles", zap.String("query", query), zap.Error(err))
		return nil, err
	}

	log.Debug("user profiles search completed", zap.String("query", query), zap.Int("result_count", len(userProfiles)))
	return userProfiles, nil
}

// GetUserProfileWithContact retrieves a user profile with contact info
func (s *UserService) GetUserProfileWithContact(ctx context.Context, authUserID, userID int64) (*domain.UserProfile, *domain.Contact, error) {
	log := logger.FromContext(ctx)
	log.Debug("retrieving user profile with contact info", zap.Int64("auth_user_id", authUserID), zap.Int64("user_id", userID))

	userProfile, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		log.Error("failed to retrieve user profile", zap.Int64("user_id", userID), zap.Error(err))
		return nil, nil, err
	}

	contact, err := s.contactRepo.GetContactByUserIds(ctx, authUserID, userID)
	if err != nil {
		// Only log at Debug if it's a not-found error; otherwise warn
		if _, isNotFound := err.(*gotoolkit.NotFoundError); isNotFound {
			log.Debug("contact not found between users", zap.Int64("auth_user_id", authUserID), zap.Int64("user_id", userID))
		} else {
			log.Warn("failed to check contact status between users", zap.Int64("auth_user_id", authUserID), zap.Int64("user_id", userID), zap.Error(err))
		}
		return nil, nil, err
	}

	log.Debug("user profile with contact retrieved successfully", zap.Int64("user_id", userID), zap.Bool("has_contact", contact != nil))
	return userProfile, contact, nil
}

// UpdateUserProfile updates a user's profile information
func (s *UserService) UpdateUserProfile(ctx context.Context, userID int64, globalName, bio *string, dp *string) (*domain.UserProfile, error) {
	log := logger.FromContext(ctx)
	log.Debug("updating user profile", zap.Int64("user_id", userID))

	// Get existing profile
	userProfile, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		log.Error("failed to retrieve user profile for update", zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}

	// Update fields if provided
	if globalName != nil {
		log.Debug("updating global name", zap.String("new_global_name", *globalName))
		userProfile.GlobalName = *globalName
	}
	if bio != nil {
		userProfile.Bio = *bio
	}
	if dp != nil {
		log.Debug("updating display picture")
		userProfile.DP = dp
	}

	// Save updated profile
	if err := s.userRepo.Update(ctx, userProfile); err != nil {
		log.Error("failed to save updated user profile", zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}

	log.Info("user profile updated successfully", zap.Int64("user_id", userID))
	return userProfile, nil
}

var _ IUserService = (*UserService)(nil)

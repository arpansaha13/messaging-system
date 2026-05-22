package service

import (
	"context"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/common/coalesce"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"go.uber.org/zap"
	"golang.org/x/sync/singleflight"
)

// UserService handles user profile business logic
type UserService struct {
	userRepo    repository.IUserRepository
	contactRepo repository.IContactRepository
	sf          singleflight.Group
}

// NewUserService creates a new user service
func NewUserService(userRepo repository.IUserRepository, contactRepo repository.IContactRepository) *UserService {
	return &UserService{
		userRepo:    userRepo,
		contactRepo: contactRepo,
	}
}

// GetUserProfile retrieves the authenticated user's profile
func (s *UserService) GetUserProfile(ctx context.Context) (*domain.UserProfile, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("retrieving user profile", zap.Int64("user_id", userID))

	key := coalesce.GetUserProfilesKey([]int64{userID})
	ch := s.sf.DoChan(key, func() (any, error) {
		detachedCtx := context.WithoutCancel(ctx)
		detachedCtx, cancel := context.WithTimeout(detachedCtx, defaultTimeout)
		defer cancel()
		return s.userRepo.GetByID(detachedCtx, userID)
	})

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-ch:
		if res.Err != nil {
			log.Error("failed to retrieve user profile", zap.Int64("user_id", userID), zap.Error(res.Err))
			return nil, res.Err
		}
		userProfile := res.Val.(*domain.UserProfile)
		log.Debug("user profile retrieved successfully", zap.Int64("user_id", userID))
		return userProfile, nil
	}
}

// SearchUserProfiles searches for user profiles
func (s *UserService) SearchUserProfiles(ctx context.Context, req *dto.SearchUsersDTO) ([]*domain.UserProfile, error) {
	log := gtk.LoggerFromContext(ctx)
	log.Debug("searching user profiles", zap.String("query", req.Q))

	userProfiles, err := s.userRepo.Search(ctx, req.Q, 20)
	if err != nil {
		log.Error("failed to search user profiles", zap.String("query", req.Q), zap.Error(err))
		return nil, err
	}

	log.Debug("user profiles search completed", zap.String("query", req.Q), zap.Int("result_count", len(userProfiles)))
	return userProfiles, nil
}

// GetUserProfileWithContact retrieves a user profile with contact info
func (s *UserService) GetUserProfileWithContact(ctx context.Context, req *dto.GetUserByIDDTO) (*domain.UserProfile, *domain.Contact, error) {
	log := gtk.LoggerFromContext(ctx)
	authUserID := utils.GetUserIDFromCtx(ctx)
	log.Debug("retrieving user profile with contact info", zap.Int64("auth_user_id", authUserID), zap.Int64("user_id", req.ID))

	key := coalesce.GetUserProfilesKey([]int64{req.ID})
	ch := s.sf.DoChan(key, func() (any, error) {
		detachedCtx := context.WithoutCancel(ctx)
		detachedCtx, cancel := context.WithTimeout(detachedCtx, defaultTimeout)
		defer cancel()
		return s.userRepo.GetByID(detachedCtx, req.ID)
	})

	var userProfile *domain.UserProfile
	select {
	case <-ctx.Done():
		return nil, nil, ctx.Err()
	case res := <-ch:
		if res.Err != nil {
			log.Error("failed to retrieve user profile", zap.Int64("user_id", req.ID), zap.Error(res.Err))
			return nil, nil, res.Err
		}
		userProfile = res.Val.(*domain.UserProfile)
	}

	contact, err := s.contactRepo.GetContactByUserIds(ctx, authUserID, req.ID)
	if err != nil {
		if _, isNotFound := err.(*gtk.NotFoundError); isNotFound {
			log.Debug("contact not found between users", zap.Int64("auth_user_id", authUserID), zap.Int64("user_id", req.ID))
		} else {
			log.Warn("failed to check contact status between users", zap.Int64("auth_user_id", authUserID), zap.Int64("user_id", req.ID), zap.Error(err))
		}
		return nil, nil, err
	}

	log.Debug("user profile with contact retrieved successfully", zap.Int64("user_id", req.ID), zap.Bool("has_contact", contact != nil))
	return userProfile, contact, nil
}

// UpdateUserProfile updates the authenticated user's profile information
func (s *UserService) UpdateUserProfile(ctx context.Context, req *dto.UpdateUserDTO) (*domain.UserProfile, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("updating user profile", zap.Int64("user_id", userID))

	userProfile, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		log.Error("failed to retrieve user profile for update", zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}

	if req.GlobalName != nil {
		log.Debug("updating global name", zap.String("new_global_name", *req.GlobalName))
		userProfile.GlobalName = *req.GlobalName
	}
	if req.Bio != nil {
		userProfile.Bio = *req.Bio
	}
	if req.DP != nil {
		log.Debug("updating display picture")
		userProfile.DP = req.DP
	}

	if err := s.userRepo.Update(ctx, userProfile); err != nil {
		log.Error("failed to save updated user profile", zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}

	log.Info("user profile updated successfully", zap.Int64("user_id", userID))
	return userProfile, nil
}

var _ IUserService = (*UserService)(nil)

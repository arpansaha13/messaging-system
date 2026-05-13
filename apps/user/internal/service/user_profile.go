package service

import (
	"context"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/user/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/user/internal/repository"
	"go.uber.org/zap"
)

// IUserProfileService defines business logic for user profiles.
type IUserProfileService interface {
	Create(ctx context.Context, userID int64, globalName string) (*domain.UserProfile, error)
	GetByID(ctx context.Context, userID int64) (*domain.UserProfile, error)
	GetByIDs(ctx context.Context, userIDs []int64) (map[int64]*domain.UserProfile, error)
	Update(ctx context.Context, userID int64, globalName, dp, bio *string) (*domain.UserProfile, error)
	Search(ctx context.Context, query string, limit int) ([]*domain.UserProfile, error)
}

// UserProfileService implements IUserProfileService.
type UserProfileService struct {
	repo repository.IUserProfileRepository
}

// NewUserProfileService creates a new UserProfileService.
func NewUserProfileService(repo repository.IUserProfileRepository) *UserProfileService {
	return &UserProfileService{repo: repo}
}

func (s *UserProfileService) Create(ctx context.Context, userID int64, globalName string) (*domain.UserProfile, error) {
	log := gtk.LoggerFromContext(ctx)
	log.Debug("creating user profile", zap.Int64("user_id", userID))

	profile := &domain.UserProfile{
		ID:         userID,
		GlobalName: globalName,
	}
	if err := s.repo.Create(ctx, profile); err != nil {
		log.Error("failed to create user profile", zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}
	return profile, nil
}

func (s *UserProfileService) GetByID(ctx context.Context, userID int64) (*domain.UserProfile, error) {
	return s.repo.GetByID(ctx, userID)
}

func (s *UserProfileService) GetByIDs(ctx context.Context, userIDs []int64) (map[int64]*domain.UserProfile, error) {
	profiles, err := s.repo.GetByIDs(ctx, userIDs)
	if err != nil {
		return nil, err
	}
	result := make(map[int64]*domain.UserProfile, len(profiles))
	for _, p := range profiles {
		result[p.ID] = p
	}
	return result, nil
}

func (s *UserProfileService) Update(ctx context.Context, userID int64, globalName, dp, bio *string) (*domain.UserProfile, error) {
	log := gtk.LoggerFromContext(ctx)
	log.Debug("updating user profile", zap.Int64("user_id", userID))

	profile, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if globalName != nil && *globalName != "" {
		profile.GlobalName = *globalName
	}
	if dp != nil {
		profile.DP = dp
	}
	if bio != nil && *bio != "" {
		profile.Bio = *bio
	}

	if err := s.repo.Update(ctx, profile); err != nil {
		log.Error("failed to update user profile", zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}
	return profile, nil
}

func (s *UserProfileService) Search(ctx context.Context, query string, limit int) ([]*domain.UserProfile, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.repo.Search(ctx, query, limit)
}

var _ IUserProfileService = (*UserProfileService)(nil)

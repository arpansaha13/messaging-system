package service

import (
	"context"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/user/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/user/internal/repository"
	"go.uber.org/zap"
	"golang.org/x/sync/singleflight"
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
	sf   singleflight.Group
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

func profileKey(userID int64) string {
	return fmt.Sprintf("user:profile:%d", userID)
}

func profilesKey(userIDs []int64) string {
	sorted := make([]int64, len(userIDs))
	copy(sorted, userIDs)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i] < sorted[j] })

	var sb strings.Builder
	sb.WriteString("user:profiles:")
	for i, id := range sorted {
		if i > 0 {
			sb.WriteByte(',')
		}
		sb.WriteString(strconv.FormatInt(id, 10))
	}
	return sb.String()
}

func (s *UserProfileService) GetByID(ctx context.Context, userID int64) (*domain.UserProfile, error) {
	key := profileKey(userID)
	ch := s.sf.DoChan(key, func() (any, error) {
		detachedCtx := context.WithoutCancel(ctx)
		detachedCtx, cancel := context.WithTimeout(detachedCtx, defaultTimeout)
		defer cancel()
		return s.repo.GetByID(detachedCtx, userID)
	})

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-ch:
		if res.Err != nil {
			return nil, res.Err
		}
		return res.Val.(*domain.UserProfile), nil
	}
}

func (s *UserProfileService) GetByIDs(ctx context.Context, userIDs []int64) (map[int64]*domain.UserProfile, error) {
	if len(userIDs) == 0 {
		return make(map[int64]*domain.UserProfile), nil
	}
	key := profilesKey(userIDs)
	ch := s.sf.DoChan(key, func() (any, error) {
		detachedCtx := context.WithoutCancel(ctx)
		detachedCtx, cancel := context.WithTimeout(detachedCtx, defaultTimeout)
		defer cancel()

		profiles, err := s.repo.GetByIDs(detachedCtx, userIDs)
		if err != nil {
			return nil, err
		}
		result := make(map[int64]*domain.UserProfile, len(profiles))
		for _, p := range profiles {
			result[p.ID] = p
		}
		return result, nil
	})

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-ch:
		if res.Err != nil {
			return nil, res.Err
		}
		return res.Val.(map[int64]*domain.UserProfile), nil
	}
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

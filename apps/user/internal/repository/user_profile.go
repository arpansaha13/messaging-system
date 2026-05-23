package repository

import (
	"context"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/user/internal/domain"
	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"
)

// IUserProfileRepository defines operations for the user_profiles table.
type IUserProfileRepository interface {
	Create(ctx context.Context, profile *domain.UserProfile) error
	GetByID(ctx context.Context, userID int64) (*domain.UserProfile, error)
	GetByIDs(ctx context.Context, userIDs []int64) ([]*domain.UserProfile, error)
	Update(ctx context.Context, profile *domain.UserProfile) error
	Search(ctx context.Context, query string, limit int) ([]*domain.UserProfile, error)
}

// UserProfileRepository implements IUserProfileRepository.
type UserProfileRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewUserProfileRepository creates a new UserProfileRepository.
func NewUserProfileRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *UserProfileRepository {
	return &UserProfileRepository{db: db, cb: cb}
}

func (r *UserProfileRepository) Create(ctx context.Context, profile *domain.UserProfile) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(profile).Error
	})
	return err
}

func (r *UserProfileRepository) GetByID(ctx context.Context, userID int64) (*domain.UserProfile, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var profile domain.UserProfile
		if err := r.db.WithContext(ctx).First(&profile, userID).Error; err != nil {
			return nil, err
		}
		return &profile, nil
	})
	if err != nil {
		if gtk.IsNotFound(err) {
			return nil, &gtk.NotFoundError{Message: "user profile not found"}
		}
		return nil, err
	}
	return result.(*domain.UserProfile), nil
}

func (r *UserProfileRepository) GetByIDs(ctx context.Context, userIDs []int64) ([]*domain.UserProfile, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var profiles []*domain.UserProfile
		if err := r.db.WithContext(ctx).Where("id IN ?", userIDs).Find(&profiles).Error; err != nil {
			return nil, err
		}
		return profiles, nil
	})
	if err != nil {
		return nil, err
	}
	return result.([]*domain.UserProfile), nil
}

func (r *UserProfileRepository) Update(ctx context.Context, profile *domain.UserProfile) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Save(profile).Error
	})
	return err
}

func (r *UserProfileRepository) Search(ctx context.Context, query string, limit int) ([]*domain.UserProfile, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var profiles []*domain.UserProfile
		db := r.db.WithContext(ctx).Where("global_name ILIKE ?", "%"+query+"%")
		if limit > 0 {
			db = db.Limit(limit)
		}
		if err := db.Find(&profiles).Error; err != nil {
			return nil, err
		}
		return profiles, nil
	})
	if err != nil {
		return nil, err
	}
	return result.([]*domain.UserProfile), nil
}

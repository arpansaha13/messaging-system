package repository

import (
	"context"
	"errors"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"
)

// UserRepository handles user profile-related database operations
type UserRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *UserRepository {
	return &UserRepository{db: db, cb: cb}
}

// GetByID retrieves a user profile by ID
func (r *UserRepository) GetByID(ctx context.Context, userID int64) (*domain.UserProfile, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var userProfile domain.UserProfile
		err := r.db.WithContext(ctx).Where("id = ?", userID).First(&userProfile).Error
		if err != nil {
			return nil, err
		}
		return &userProfile, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "user profile not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get user profile", Err: err}
	}

	return result.(*domain.UserProfile), nil
}

// Create creates a new user profile
func (r *UserRepository) Create(ctx context.Context, userProfile *domain.UserProfile) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(userProfile).Error
	})

	if err != nil {
		return &gtk.InternalError{Message: "failed to create user profile", Err: err}
	}
	return nil
}

// Update updates a user profile
func (r *UserRepository) Update(ctx context.Context, userProfile *domain.UserProfile) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Save(userProfile).Error
	})

	if err != nil {
		return &gtk.InternalError{Message: "failed to update user profile", Err: err}
	}
	return nil
}

// Delete deletes a user profile (soft delete)
func (r *UserRepository) Delete(ctx context.Context, userID int64) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Delete(&domain.UserProfile{}, userID).Error
	})

	if err != nil {
		return &gtk.InternalError{Message: "failed to delete user profile", Err: err}
	}
	return nil
}

// Search searches for user profiles by global_name
func (r *UserRepository) Search(ctx context.Context, query string, limit int) ([]*domain.UserProfile, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var userProfiles []*domain.UserProfile
		err := r.db.WithContext(ctx).
			Where("global_name ILIKE ?", "%"+query+"%").
			Limit(limit).
			Find(&userProfiles).Error
		if err != nil {
			return nil, err
		}
		return userProfiles, nil
	})

	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to search user profiles", Err: err}
	}

	return result.([]*domain.UserProfile), nil
}

var _ IUserRepository = (*UserRepository)(nil)

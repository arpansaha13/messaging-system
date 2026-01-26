package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
)

// UserRepository handles user profile-related database operations
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// GetByID retrieves a user profile by ID
func (r *UserRepository) GetByID(ctx context.Context, userID int64) (*domain.UserProfile, error) {
	var userProfile domain.UserProfile
	err := r.db.WithContext(ctx).Where("id = ?", userID).First(&userProfile).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &domain.NotFoundError{Message: "user profile not found"}
		}
		return nil, &domain.InternalError{Message: "failed to get user profile", Err: err}
	}

	return &userProfile, nil
}

// Create creates a new user profile
func (r *UserRepository) Create(ctx context.Context, userProfile *domain.UserProfile) error {
	if err := r.db.WithContext(ctx).Create(userProfile).Error; err != nil {
		return &domain.InternalError{Message: "failed to create user profile", Err: err}
	}
	return nil
}

// Update updates a user profile
func (r *UserRepository) Update(ctx context.Context, userProfile *domain.UserProfile) error {
	if err := r.db.WithContext(ctx).Save(userProfile).Error; err != nil {
		return &domain.InternalError{Message: "failed to update user profile", Err: err}
	}
	return nil
}

// Delete deletes a user profile (soft delete)
func (r *UserRepository) Delete(ctx context.Context, userID int64) error {
	if err := r.db.WithContext(ctx).Delete(&domain.UserProfile{}, userID).Error; err != nil {
		return &domain.InternalError{Message: "failed to delete user profile", Err: err}
	}
	return nil
}

// Search searches for user profiles by global_name
func (r *UserRepository) Search(ctx context.Context, query string, limit int) ([]*domain.UserProfile, error) {
	var userProfiles []*domain.UserProfile
	err := r.db.WithContext(ctx).
		Where("global_name ILIKE ?", "%"+query+"%").
		Limit(limit).
		Find(&userProfiles).Error

	if err != nil {
		return nil, &domain.InternalError{Message: "failed to search user profiles", Err: err}
	}

	return userProfiles, nil
}

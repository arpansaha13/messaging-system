package repository

import (
	"context"
	"errors"
	"time"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
)

// UserRepository handles user-related database operations
type UserRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *UserRepository {
	return &UserRepository{db: db, cb: cb}
}

// Create creates a new user and associated records in a transaction
func (r *UserRepository) Create(ctx context.Context, user *domain.User, credentials *domain.Credentials) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
			// Create user
			if err := tx.Create(user).Error; err != nil {
				return err
			}

			// Create credentials
			credentials.UserID = user.ID
			if err := tx.Create(credentials).Error; err != nil {
				return err
			}

			return nil
		})
	})
	return err
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var user domain.User
		err := r.db.WithContext(ctx).
			Preload("Credentials").
			Preload("OTP").
			Where("email = ?", email).
			First(&user).Error
		if err != nil {
			return nil, err
		}
		return &user, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "user not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get user", Err: err}
	}

	return result.(*domain.User), nil
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(ctx context.Context, userID int64) (*domain.User, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var user domain.User
		err := r.db.WithContext(ctx).
			Preload("Credentials").
			Preload("OTP").
			Where("id = ?", userID).
			First(&user).Error
		if err != nil {
			return nil, err
		}
		return &user, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "user not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get user", Err: err}
	}

	return result.(*domain.User), nil
}

// GetByUsername retrieves a user by username
func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var user domain.User
		err := r.db.WithContext(ctx).
			Preload("Credentials").
			Preload("OTP").
			Where("username = ?", username).
			First(&user).Error
		if err != nil {
			return nil, err
		}
		return &user, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "user not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get user", Err: err}
	}

	return result.(*domain.User), nil
}

// UpdateVerified marks a user as verified and sets their username
func (r *UserRepository) UpdateVerified(ctx context.Context, userID int64, username string) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).
			Model(&domain.User{}).
			Where("id = ?", userID).
			Updates(map[string]any{
				"verified": true,
				"username": username,
			}).Error
	})
	return err
}

// UpdateLastLogin updates the user's last login timestamp
func (r *UserRepository) UpdateLastLogin(ctx context.Context, userID int64) error {
	_, err := r.cb.Execute(func() (any, error) {
		now := time.Now()
		return nil, r.db.WithContext(ctx).
			Model(&domain.User{}).
			Where("id = ?", userID).
			Update("last_login", now).Error
	})
	return err
}

// UpdatePassword updates the user's password hash in the credentials table
func (r *UserRepository) UpdatePassword(ctx context.Context, userID int64, newPasswordHash string) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).
			Model(&domain.Credentials{}).
			Where("user_id = ?", userID).
			Update("password_hash", newPasswordHash).Error
	})
	return err
}

// ExistsUsername checks if a username already exists
func (r *UserRepository) ExistsUsername(ctx context.Context, username string) (bool, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var count int64
		err := r.db.WithContext(ctx).
			Model(&domain.User{}).
			Where("username = ?", username).
			Count(&count).Error
		if err != nil {
			return nil, err
		}
		return count > 0, nil
	})

	if err != nil {
		return false, &gtk.InternalError{Message: "failed to check username", Err: err}
	}

	return result.(bool), nil
}

// ExistsEmail checks if an email already exists
func (r *UserRepository) ExistsEmail(ctx context.Context, email string) (bool, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var count int64
		err := r.db.WithContext(ctx).
			Model(&domain.User{}).
			Where("email = ?", email).
			Count(&count).Error
		if err != nil {
			return nil, err
		}
		return count > 0, nil
	})

	if err != nil {
		return false, &gtk.InternalError{Message: "failed to check email", Err: err}
	}

	return result.(bool), nil
}

// Delete hard-deletes a user and all related data (cascade delete)
func (r *UserRepository) Delete(ctx context.Context, userID int64) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).
			Where("id = ?", userID).
			Delete(&domain.User{}).Error
	})
	return err
}

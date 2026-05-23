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

// ProviderRepository handles provider-related database operations
type ProviderRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewProviderRepository creates a new provider repository
func NewProviderRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *ProviderRepository {
	return &ProviderRepository{db: db, cb: cb}
}

// Create links a provider to a user
func (r *ProviderRepository) Create(ctx context.Context, provider *domain.UserProvider) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(provider).Error
	})
	if err != nil {
		return &gtk.InternalError{Message: "failed to link provider", Err: err}
	}
	return nil
}

// GetByProvider retrieves a user provider entry
func (r *ProviderRepository) GetByProvider(ctx context.Context, providerID domain.ProviderType, providerSub string) (*domain.UserProvider, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var provider domain.UserProvider
		err := r.db.WithContext(ctx).
			Where("provider_id = ? AND provider_sub = ?", providerID, providerSub).
			First(&provider).Error
		if err != nil {
			return nil, err
		}
		return &provider, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "provider link not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get provider link", Err: err}
	}

	return result.(*domain.UserProvider), nil
}

// UpdateLastLogin updates the last login timestamp for a provider
func (r *ProviderRepository) UpdateLastLogin(ctx context.Context, providerID domain.ProviderType, providerSub string) error {
	_, err := r.cb.Execute(func() (any, error) {
		now := time.Now()
		return nil, r.db.WithContext(ctx).
			Model(&domain.UserProvider{}).
			Where("provider_id = ? AND provider_sub = ?", providerID, providerSub).
			Update("last_login_at", now).Error
	})
	return err
}

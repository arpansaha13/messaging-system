package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// InviteRepository handles invite-related database operations
type InviteRepository struct {
	db *gorm.DB
}

// NewInviteRepository creates a new invite repository
func NewInviteRepository(db *gorm.DB) *InviteRepository {
	return &InviteRepository{db: db}
}

// Create creates a new invite
func (r *InviteRepository) Create(ctx context.Context, invite *domain.Invite) error {
	if err := r.db.WithContext(ctx).Create(invite).Error; err != nil {
		return &domain.InternalError{Message: "failed to create invite", Err: err}
	}
	return nil
}

// GetByHash retrieves an invite by hash that has not expired
func (r *InviteRepository) GetByHash(ctx context.Context, hash string) (*domain.Invite, error) {
	var invite domain.Invite
	err := r.db.WithContext(ctx).
		Where("hash = ? AND (expires_at IS NULL OR expires_at > ?)", hash, time.Now()).
		First(&invite).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &domain.NotFoundError{Message: "invite not found or expired"}
		}
		return nil, &domain.InternalError{Message: "failed to get invite", Err: err}
	}

	return &invite, nil
}

// GetByHashWithGroup retrieves an invite by hash with its associated group
func (r *InviteRepository) GetByHashWithGroup(ctx context.Context, hash string) (*domain.Invite, error) {
	var invite domain.Invite
	err := r.db.WithContext(ctx).
		Where("hash = ?", hash).
		Preload("Group").
		First(&invite).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &domain.NotFoundError{Message: "invite not found"}
		}
		return nil, &domain.InternalError{Message: "failed to get invite", Err: err}
	}

	return &invite, nil
}

// Delete deletes an invite
func (r *InviteRepository) Delete(ctx context.Context, hash string) error {
	if err := r.db.WithContext(ctx).Delete(&domain.Invite{}, hash).Error; err != nil {
		return &domain.InternalError{Message: "failed to delete invite", Err: err}
	}
	return nil
}

// Update updates an invite
func (r *InviteRepository) Update(ctx context.Context, invite *domain.Invite) error {
	if err := r.db.WithContext(ctx).Save(invite).Error; err != nil {
		return &domain.InternalError{Message: "failed to update invite", Err: err}
	}
	return nil
}

var _ IInviteRepository = (*InviteRepository)(nil)

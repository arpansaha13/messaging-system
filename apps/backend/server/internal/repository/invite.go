package repository

import (
	"context"
	"errors"
	"time"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"
)

// InviteRepository handles invite-related database operations
type InviteRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewInviteRepository creates a new invite repository
func NewInviteRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *InviteRepository {
	return &InviteRepository{db: db, cb: cb}
}

// Create creates a new invite.
//
// This method does not perform membership checks; callers should verify
// isMember in the service layer via userGroupRepo.Exists before creating
// group-scoped invites.
func (r *InviteRepository) Create(ctx context.Context, invite *domain.Invite) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(invite).Error
	})
	if err != nil {
		return &gtk.InternalError{Message: "failed to create invite", Err: err}
	}
	return nil
}

// GetByHash retrieves an invite by hash that has not expired
func (r *InviteRepository) GetByHash(ctx context.Context, hash string) (*domain.Invite, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var invite domain.Invite
		err := r.db.WithContext(ctx).
			Where("hash = ? AND (expires_at IS NULL OR expires_at > ?)", hash, time.Now()).
			First(&invite).Error
		if err != nil {
			return nil, err
		}
		return &invite, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "invite not found or expired"}
		}
		return nil, &gtk.InternalError{Message: "failed to get invite", Err: err}
	}
	return result.(*domain.Invite), nil
}

// GetByHashWithGroup retrieves an invite by hash with its associated group
func (r *InviteRepository) GetByHashWithGroup(ctx context.Context, hash string) (*domain.Invite, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var invite domain.Invite
		err := r.db.WithContext(ctx).
			Where("hash = ?", hash).
			Preload("Group").
			First(&invite).Error
		if err != nil {
			return nil, err
		}
		return &invite, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "invite not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get invite", Err: err}
	}
	return result.(*domain.Invite), nil
}

// Delete deletes an invite
func (r *InviteRepository) Delete(ctx context.Context, hash string) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Delete(&domain.Invite{}, hash).Error
	})
	if err != nil {
		return &gtk.InternalError{Message: "failed to delete invite", Err: err}
	}
	return nil
}

// Update updates an invite
func (r *InviteRepository) Update(ctx context.Context, invite *domain.Invite) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Save(invite).Error
	})
	if err != nil {
		return &gtk.InternalError{Message: "failed to update invite", Err: err}
	}
	return nil
}

var _ IInviteRepository = (*InviteRepository)(nil)

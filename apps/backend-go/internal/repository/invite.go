package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
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

// GetByID retrieves an invite by ID
func (r *InviteRepository) GetByID(ctx context.Context, inviteID int64) (*domain.Invite, error) {
	var invite domain.Invite
	err := r.db.WithContext(ctx).Where("id = ?", inviteID).First(&invite).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &domain.NotFoundError{Message: "invite not found"}
		}
		return nil, &domain.InternalError{Message: "failed to get invite", Err: err}
	}

	return &invite, nil
}

// GetUserInvites retrieves pending invites for a user
func (r *InviteRepository) GetUserInvites(ctx context.Context, userID int64) ([]*domain.Invite, error) {
	var invites []*domain.Invite
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND status = ?", userID, "pending").
		Find(&invites).Error

	if err != nil {
		return nil, &domain.InternalError{Message: "failed to get invites", Err: err}
	}

	return invites, nil
}

// Delete deletes an invite
func (r *InviteRepository) Delete(ctx context.Context, inviteID int64) error {
	if err := r.db.WithContext(ctx).Delete(&domain.Invite{}, inviteID).Error; err != nil {
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

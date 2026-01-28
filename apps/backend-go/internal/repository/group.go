package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
)

// GroupRepository handles group-related database operations
type GroupRepository struct {
	db *gorm.DB
}

// NewGroupRepository creates a new group repository
func NewGroupRepository(db *gorm.DB) *GroupRepository {
	return &GroupRepository{db: db}
}

// Create creates a new group
func (r *GroupRepository) Create(ctx context.Context, group *domain.Group) error {
	if err := r.db.WithContext(ctx).Create(group).Error; err != nil {
		return &domain.InternalError{Message: "failed to create group", Err: err}
	}
	return nil
}

// GetByID retrieves a group by ID
func (r *GroupRepository) GetByID(ctx context.Context, groupID int64) (*domain.Group, error) {
	var group domain.Group
	err := r.db.WithContext(ctx).Where("id = ?", groupID).First(&group).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &domain.NotFoundError{Message: "group not found"}
		}
		return nil, &domain.InternalError{Message: "failed to get group", Err: err}
	}

	return &group, nil
}

// GetAll retrieves all groups
func (r *GroupRepository) GetAll(ctx context.Context) ([]*domain.Group, error) {
	var groups []*domain.Group
	err := r.db.WithContext(ctx).Find(&groups).Error

	if err != nil {
		return nil, &domain.InternalError{Message: "failed to get groups", Err: err}
	}

	return groups, nil
}

// Delete deletes a group
func (r *GroupRepository) Delete(ctx context.Context, groupID int64) error {
	if err := r.db.WithContext(ctx).Delete(&domain.Group{}, groupID).Error; err != nil {
		return &domain.InternalError{Message: "failed to delete group", Err: err}
	}
	return nil
}

// Update updates a group
func (r *GroupRepository) Update(ctx context.Context, group *domain.Group) error {
	if err := r.db.WithContext(ctx).Save(group).Error; err != nil {
		return &domain.InternalError{Message: "failed to update group", Err: err}
	}
	return nil
}

var _ IGroupRepository = (*GroupRepository)(nil)

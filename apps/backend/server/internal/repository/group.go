package repository

import (
	"context"
	"errors"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"
)

// GroupRepository handles group-related database operations
type GroupRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewGroupRepository creates a new group repository
func NewGroupRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *GroupRepository {
	return &GroupRepository{db: db, cb: cb}
}

// Create creates a new group
func (r *GroupRepository) Create(ctx context.Context, group *domain.Group) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(group).Error
	})
	if err != nil {
		return &gtk.InternalError{Message: "failed to create group", Err: err}
	}
	return nil
}

// GetByID retrieves a group by ID
func (r *GroupRepository) GetByID(ctx context.Context, groupID int64) (*domain.Group, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var group domain.Group
		err := r.db.WithContext(ctx).Where("id = ?", groupID).First(&group).Error
		if err != nil {
			return nil, err
		}
		return &group, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "group not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get group", Err: err}
	}
	return result.(*domain.Group), nil
}

// GetAll retrieves all groups
func (r *GroupRepository) GetAll(ctx context.Context) ([]*domain.Group, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var groups []*domain.Group
		err := r.db.WithContext(ctx).Find(&groups).Error
		if err != nil {
			return nil, err
		}
		return groups, nil
	})

	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to get groups", Err: err}
	}
	return result.([]*domain.Group), nil
}

// Delete deletes a group
func (r *GroupRepository) Delete(ctx context.Context, groupID int64) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Delete(&domain.Group{}, groupID).Error
	})
	if err != nil {
		return &gtk.InternalError{Message: "failed to delete group", Err: err}
	}
	return nil
}

// Update updates a group
func (r *GroupRepository) Update(ctx context.Context, group *domain.Group) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Save(group).Error
	})
	if err != nil {
		return &gtk.InternalError{Message: "failed to update group", Err: err}
	}
	return nil
}

var _ IGroupRepository = (*GroupRepository)(nil)

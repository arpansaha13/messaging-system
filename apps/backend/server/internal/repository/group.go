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

// GetByIDUnscoped retrieves a group by ID without membership scoping.
//
// Callers handling protected group actions must enforce membership in the
// service layer (for example via userGroupRepo.Exists) before using this.
func (r *GroupRepository) GetByIDUnscoped(ctx context.Context, groupID int64) (*domain.Group, error) {
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

// GetByID retrieves a group by ID only if the user is a member
func (r *GroupRepository) GetByID(ctx context.Context, userID, groupID int64) (*domain.Group, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var group domain.Group
		err := r.db.WithContext(ctx).
			Model(&domain.Group{}).
			Joins("JOIN user_groups ON user_groups.group_id = groups.id").
			Where("groups.id = ? AND user_groups.user_id = ?", groupID, userID).
			First(&group).Error
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

// GetAll retrieves all groups where the user has membership
func (r *GroupRepository) GetAll(ctx context.Context, userID int64) ([]*domain.Group, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var groups []*domain.Group
		err := r.db.WithContext(ctx).
			Model(&domain.Group{}).
			Select("DISTINCT groups.*").
			Joins("JOIN user_groups ON user_groups.group_id = groups.id").
			Where("user_groups.user_id = ?", userID).
			Find(&groups).Error
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

var _ IGroupRepository = (*GroupRepository)(nil)

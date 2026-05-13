package repository

import (
	"context"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"
)

// UserGroupRepository handles user group membership operations
type UserGroupRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewUserGroupRepository creates a new user group repository
func NewUserGroupRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *UserGroupRepository {
	return &UserGroupRepository{db: db, cb: cb}
}

// Create creates a new user group membership
func (r *UserGroupRepository) Create(ctx context.Context, userGroup *domain.UserGroup) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(userGroup).Error
	})
	if err != nil {
		return &gtk.InternalError{Message: "failed to create user group", Err: err}
	}
	return nil
}

// GetGroupMembers retrieves all members of a group only if requester belongs to the same group
func (r *UserGroupRepository) GetGroupMembers(ctx context.Context, userID, groupID int64) ([]*domain.UserGroup, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var members []*domain.UserGroup
		err := r.db.WithContext(ctx).
			Model(&domain.UserGroup{}).
			Select("DISTINCT user_groups.*").
			Joins("JOIN user_groups AS requester_membership ON requester_membership.group_id = user_groups.group_id").
			Where("user_groups.group_id = ? AND requester_membership.user_id = ?", groupID, userID).
			Find(&members).Error
		if err != nil {
			return nil, err
		}
		return members, nil
	})

	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to get group members", Err: err}
	}

	return result.([]*domain.UserGroup), nil
}

// Exists checks if a user is a member of a group
func (r *UserGroupRepository) Exists(ctx context.Context, userID, groupID int64) (bool, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var count int64
		err := r.db.WithContext(ctx).
			Model(&domain.UserGroup{}).
			Where("user_id = ? AND group_id = ?", userID, groupID).
			Count(&count).Error
		if err != nil {
			return nil, err
		}
		return count > 0, nil
	})

	if err != nil {
		return false, &gtk.InternalError{Message: "failed to check user group", Err: err}
	}
	return result.(bool), nil
}

var _ IUserGroupRepository = (*UserGroupRepository)(nil)

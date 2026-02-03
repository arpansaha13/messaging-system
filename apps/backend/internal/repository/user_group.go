package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/domain"
)

// UserGroupRepository handles user group membership operations
type UserGroupRepository struct {
	db *gorm.DB
}

// NewUserGroupRepository creates a new user group repository
func NewUserGroupRepository(db *gorm.DB) *UserGroupRepository {
	return &UserGroupRepository{db: db}
}

// Create creates a new user group membership
func (r *UserGroupRepository) Create(ctx context.Context, userGroup *domain.UserGroup) error {
	if err := r.db.WithContext(ctx).Create(userGroup).Error; err != nil {
		return &domain.InternalError{Message: "failed to create user group", Err: err}
	}
	return nil
}

// GetByID retrieves a user group by ID
func (r *UserGroupRepository) GetByID(ctx context.Context, userGroupID int64) (*domain.UserGroup, error) {
	var userGroup domain.UserGroup
	err := r.db.WithContext(ctx).Where("id = ?", userGroupID).First(&userGroup).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &domain.NotFoundError{Message: "user group not found"}
		}
		return nil, &domain.InternalError{Message: "failed to get user group", Err: err}
	}

	return &userGroup, nil
}

// GetGroupMembers retrieves all members of a group with user data
func (r *UserGroupRepository) GetGroupMembers(ctx context.Context, groupID int64) ([]*domain.UserGroup, error) {
	var members []*domain.UserGroup
	err := r.db.WithContext(ctx).Preload("User").Where("group_id = ?", groupID).Find(&members).Error

	if err != nil {
		return nil, &domain.InternalError{Message: "failed to get group members", Err: err}
	}

	return members, nil
}

// GetUserGroups retrieves all groups a user belongs to
func (r *UserGroupRepository) GetUserGroups(ctx context.Context, userID int64) ([]*domain.UserGroup, error) {
	var groups []*domain.UserGroup
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&groups).Error

	if err != nil {
		return nil, &domain.InternalError{Message: "failed to get user groups", Err: err}
	}

	return groups, nil
}

// Exists checks if a user is a member of a group
func (r *UserGroupRepository) Exists(ctx context.Context, userID, groupID int64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&domain.UserGroup{}).
		Where("user_id = ? AND group_id = ?", userID, groupID).
		Count(&count).Error

	if err != nil {
		return false, &domain.InternalError{Message: "failed to check user group", Err: err}
	}

	return count > 0, nil
}

// Delete deletes a user group membership
func (r *UserGroupRepository) Delete(ctx context.Context, userGroupID int64) error {
	if err := r.db.WithContext(ctx).Delete(&domain.UserGroup{}, userGroupID).Error; err != nil {
		return &domain.InternalError{Message: "failed to delete user group", Err: err}
	}
	return nil
}

// Update updates a user group membership
func (r *UserGroupRepository) Update(ctx context.Context, userGroup *domain.UserGroup) error {
	if err := r.db.WithContext(ctx).Save(userGroup).Error; err != nil {
		return &domain.InternalError{Message: "failed to update user group", Err: err}
	}
	return nil
}

var _ IUserGroupRepository = (*UserGroupRepository)(nil)

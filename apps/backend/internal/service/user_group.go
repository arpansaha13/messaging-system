package service

import (
	"context"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// UserGroupService handles user group membership logic
type UserGroupService struct {
	userGroupRepo repository.IUserGroupRepository
	userRepo      repository.IUserRepository
	groupRepo     repository.IGroupRepository
}

// NewUserGroupService creates a new user group service
func NewUserGroupService(userGroupRepo repository.IUserGroupRepository, userRepo repository.IUserRepository, groupRepo repository.IGroupRepository) *UserGroupService {
	return &UserGroupService{
		userGroupRepo: userGroupRepo,
		userRepo:      userRepo,
		groupRepo:     groupRepo,
	}
}

// GetGroupMembers retrieves all members of a group
func (s *UserGroupService) GetGroupMembers(ctx context.Context, groupID int64) ([]*domain.UserGroup, error) {
	log := logger.FromContext(ctx)
	log.Debug("retrieving group members", zap.Int64("group_id", groupID))

	members, err := s.userGroupRepo.GetGroupMembers(ctx, groupID)
	if err != nil {
		log.Error("failed to retrieve group members", zap.Int64("group_id", groupID), zap.Error(err))
		return nil, err
	}

	log.Debug("group members retrieved successfully", zap.Int64("group_id", groupID), zap.Int("member_count", len(members)))
	return members, nil
}

var _ IUserGroupService = (*UserGroupService)(nil)

package service

import (
	"context"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"go.uber.org/zap"
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
func (s *UserGroupService) GetGroupMembers(ctx context.Context, req *dto.GetGroupMembersDTO) ([]*domain.UserGroup, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("retrieving group members", zap.Int64("group_id", req.GroupID), zap.Int64("user_id", userID))

	isMember, err := s.userGroupRepo.Exists(ctx, userID, req.GroupID)
	if err != nil {
		log.Error("failed to verify requester group membership", zap.Int64("group_id", req.GroupID), zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}
	if !isMember {
		log.Warn("group members listing forbidden for non-member", zap.Int64("group_id", req.GroupID), zap.Int64("user_id", userID))
		return nil, &gtk.ForbiddenError{Message: "not a member of this group"}
	}

	members, err := s.userGroupRepo.GetGroupMembers(ctx, userID, req.GroupID)
	if err != nil {
		log.Error("failed to retrieve group members", zap.Int64("group_id", req.GroupID), zap.Error(err))
		return nil, err
	}

	log.Debug("group members retrieved successfully", zap.Int64("group_id", req.GroupID), zap.Int("member_count", len(members)))
	return members, nil
}

var _ IUserGroupService = (*UserGroupService)(nil)

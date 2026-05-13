package service

import (
	"context"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"go.uber.org/zap"
)

// UserGroupService handles user group membership logic
type UserGroupService struct {
	userGroupRepo repository.IUserGroupRepository
	userClient    IUserServiceClient
	groupRepo     repository.IGroupRepository
}

// NewUserGroupService creates a new user group service
func NewUserGroupService(userGroupRepo repository.IUserGroupRepository, userClient IUserServiceClient, groupRepo repository.IGroupRepository) *UserGroupService {
	return &UserGroupService{
		userGroupRepo: userGroupRepo,
		userClient:    userClient,
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

	if len(members) == 0 {
		return members, nil
	}

	// Hydrate members with profiles
	userIDs := make([]int64, 0, len(members))
	for _, m := range members {
		userIDs = append(userIDs, m.UserID)
	}

	profiles, err := s.userClient.GetDomainProfiles(ctx, userIDs)
	if err != nil {
		log.Error("failed to fetch profiles for group members", zap.Int64("group_id", req.GroupID), zap.Error(err))
		return nil, err
	}

	for _, m := range members {
		if p, ok := profiles[m.UserID]; ok {
			m.User = p
		}
	}

	log.Debug("group members retrieved and hydrated successfully", zap.Int64("group_id", req.GroupID), zap.Int("member_count", len(members)))
	return members, nil
}

var _ IUserGroupService = (*UserGroupService)(nil)

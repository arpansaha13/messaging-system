package service

import (
	"context"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// GroupService handles group business logic
type GroupService struct {
	groupRepo     repository.IGroupRepository
	userGroupRepo repository.IUserGroupRepository
	userRepo      repository.IUserRepository
}

// NewGroupService creates a new group service
func NewGroupService(groupRepo repository.IGroupRepository, userGroupRepo repository.IUserGroupRepository, userRepo repository.IUserRepository) *GroupService {
	return &GroupService{
		groupRepo:     groupRepo,
		userGroupRepo: userGroupRepo,
		userRepo:      userRepo,
	}
}

// CreateGroup creates a new group
func (s *GroupService) CreateGroup(ctx context.Context, req *dto.CreateGroupDTO) (*domain.Group, error) {
	log := logger.FromContext(ctx)
	founderID := utils.GetUserIDFromCtx(ctx)
	log.Debug("creating group", zap.String("group_name", req.Name), zap.Int64("founder_id", founderID))

	group := &domain.Group{
		Name:      req.Name,
		FounderID: founderID,
	}

	if err := s.groupRepo.Create(ctx, group); err != nil {
		log.Error("failed to create group in repository", zap.String("group_name", req.Name), zap.Int64("founder_id", founderID), zap.Error(err))
		return nil, err
	}

	// Add creator as member
	userGroup := &domain.UserGroup{
		UserID:  founderID,
		GroupID: group.ID,
		Role:    "admin",
	}
	if err := s.userGroupRepo.Create(ctx, userGroup); err != nil {
		log.Warn("failed to add creator as group member", zap.Int64("group_id", group.ID), zap.Error(err))
	}

	log.Info("group created successfully", zap.Int64("group_id", group.ID), zap.String("group_name", req.Name))
	return group, nil
}

// GetGroups retrieves all groups the authenticated user belongs to
func (s *GroupService) GetGroups(ctx context.Context) ([]*domain.Group, error) {
	log := logger.FromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("retrieving groups for user", zap.Int64("user_id", userID))

	userGroups, err := s.userGroupRepo.GetUserGroups(ctx, userID)
	if err != nil {
		log.Error("failed to retrieve user groups from repository", zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}

	groups := make([]*domain.Group, len(userGroups))
	for i, ug := range userGroups {
		group, err := s.groupRepo.GetByID(ctx, ug.GroupID)
		if err != nil {
			log.Error("failed to retrieve group details", zap.Int64("group_id", ug.GroupID), zap.Error(err))
			return nil, err
		}
		groups[i] = group
	}

	log.Debug("groups retrieved successfully", zap.Int64("user_id", userID), zap.Int("group_count", len(groups)))
	return groups, nil
}

var _ IGroupService = (*GroupService)(nil)

package service

import (
	"context"
	"log"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
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
	members, err := s.userGroupRepo.GetGroupMembers(ctx, groupID)
	if err != nil {
		log.Printf("failed to get group members: %v", err)
		return nil, err
	}
	return members, nil
}

var _ IUserGroupService = (*UserGroupService)(nil)

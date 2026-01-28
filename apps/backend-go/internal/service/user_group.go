package service

import (
	"context"
	"log"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository"
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

// AddUserToGroup adds a user to a group
func (s *UserGroupService) AddUserToGroup(ctx context.Context, userID, groupID int64) (*domain.UserGroup, error) {
	userGroup := &domain.UserGroup{
		UserID:  userID,
		GroupID: groupID,
		Role:    "member",
	}

	if err := s.userGroupRepo.Create(ctx, userGroup); err != nil {
		log.Printf("failed to add user to group: %v", err)
		return nil, err
	}

	return userGroup, nil
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

// GetUserGroups retrieves all groups a user belongs to
func (s *UserGroupService) GetUserGroups(ctx context.Context, userID int64) ([]*domain.UserGroup, error) {
	groups, err := s.userGroupRepo.GetUserGroups(ctx, userID)
	if err != nil {
		log.Printf("failed to get user groups: %v", err)
		return nil, err
	}
	return groups, nil
}

var _ IUserGroupService = (*UserGroupService)(nil)

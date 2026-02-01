package service

import (
	"context"
	"log"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository"
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
func (s *GroupService) CreateGroup(ctx context.Context, name string, founderID int64) (*domain.Group, error) {
	group := &domain.Group{
		Name:      name,
		FounderID: founderID,
	}

	if err := s.groupRepo.Create(ctx, group); err != nil {
		log.Printf("failed to create group: %v", err)
		return nil, err
	}

	// Add creator as member
	userGroup := &domain.UserGroup{
		UserID:  founderID,
		GroupID: group.ID,
		Role:    "admin",
	}
	s.userGroupRepo.Create(ctx, userGroup)

	return group, nil
}

// GetGroups retrieves all groups the user belongs to
func (s *GroupService) GetGroups(ctx context.Context, userID int64) ([]*domain.Group, error) {
	userGroups, err := s.userGroupRepo.GetUserGroups(ctx, userID)
	if err != nil {
		log.Printf("failed to get user groups: %v", err)
		return nil, err
	}

	groups := make([]*domain.Group, len(userGroups))
	for i, ug := range userGroups {
		group, err := s.groupRepo.GetByID(ctx, ug.GroupID)
		if err != nil {
			log.Printf("failed to get group: %v", err)
			return nil, err
		}
		groups[i] = group
	}
	return groups, nil
}

var _ IGroupService = (*GroupService)(nil)

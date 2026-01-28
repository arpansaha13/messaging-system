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

// GetGroups retrieves all groups
func (s *GroupService) GetGroups(ctx context.Context) ([]*domain.Group, error) {
	groups, err := s.groupRepo.GetAll(ctx)
	if err != nil {
		log.Printf("failed to get groups: %v", err)
		return nil, err
	}
	return groups, nil
}

var _ IGroupService = (*GroupService)(nil)

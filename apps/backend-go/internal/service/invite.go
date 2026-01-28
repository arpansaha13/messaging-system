package service

import (
	"context"
	"log"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository"
)

// InviteService handles invite business logic
type InviteService struct {
	inviteRepo repository.IInviteRepository
	groupRepo  repository.IGroupRepository
	userRepo   repository.IUserRepository
}

// NewInviteService creates a new invite service
func NewInviteService(inviteRepo repository.IInviteRepository, groupRepo repository.IGroupRepository, userRepo repository.IUserRepository) *InviteService {
	return &InviteService{
		inviteRepo: inviteRepo,
		groupRepo:  groupRepo,
		userRepo:   userRepo,
	}
}

// SendInvite sends an invite to join a group
func (s *InviteService) SendInvite(ctx context.Context, groupID, userID, invitedBy int64) (*domain.Invite, error) {
	// Verify group exists
	_, err := s.groupRepo.GetByID(ctx, groupID)
	if err != nil {
		log.Printf("failed to verify group: %v", err)
		return nil, err
	}

	// Verify user exists
	_, err = s.userRepo.GetByID(ctx, userID)
	if err != nil {
		log.Printf("failed to verify user: %v", err)
		return nil, err
	}

	invite := &domain.Invite{
		GroupID:   groupID,
		UserID:    userID,
		InvitedBy: invitedBy,
		Status:    "pending",
	}

	if err := s.inviteRepo.Create(ctx, invite); err != nil {
		log.Printf("failed to send invite: %v", err)
		return nil, err
	}

	return invite, nil
}

// GetInvites retrieves pending invites for a user
func (s *InviteService) GetInvites(ctx context.Context, userID int64) ([]*domain.Invite, error) {
	invites, err := s.inviteRepo.GetUserInvites(ctx, userID)
	if err != nil {
		log.Printf("failed to get invites: %v", err)
		return nil, err
	}
	return invites, nil
}

var _ IInviteService = (*InviteService)(nil)

package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"time"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository"
)

// AcceptInviteResponseDTO represents the response when accepting an invite
type AcceptInviteResponseDTO struct {
	GroupID  int64   `json:"groupId"`
	Channels []int64 `json:"channels"`
}

// InviteService handles invite business logic
type InviteService struct {
	inviteRepo    repository.IInviteRepository
	groupRepo     repository.IGroupRepository
	userGroupRepo repository.IUserGroupRepository
	channelRepo   repository.IChannelRepository
}

// NewInviteService creates a new invite service
func NewInviteService(
	inviteRepo repository.IInviteRepository,
	groupRepo repository.IGroupRepository,
	userGroupRepo repository.IUserGroupRepository,
	channelRepo repository.IChannelRepository,
) *InviteService {
	return &InviteService{
		inviteRepo:    inviteRepo,
		groupRepo:     groupRepo,
		userGroupRepo: userGroupRepo,
		channelRepo:   channelRepo,
	}
}

// generateHash generates a random hash string
func (s *InviteService) generateHash() (string, error) {
	b := make([]byte, 4)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// CreateInvite creates a new invite for a group
func (s *InviteService) CreateInvite(ctx context.Context, inviterID, groupID int64) (*domain.Invite, error) {
	// Verify group exists
	_, err := s.groupRepo.GetByID(ctx, groupID)
	if err != nil {
		log.Printf("failed to verify group: %v", err)
		return nil, err
	}

	// Generate unique hash
	hash, err := s.generateHash()
	if err != nil {
		log.Printf("failed to generate invite hash: %v", err)
		return nil, &domain.InternalError{Message: "failed to generate invite", Err: err}
	}

	// Set expiration to 24 hours from now
	expiresAt := time.Now().Add(24 * time.Hour)

	invite := &domain.Invite{
		Hash:      hash,
		InviterID: inviterID,
		GroupID:   &groupID,
		ExpiresAt: &expiresAt,
	}

	if err := s.inviteRepo.Create(ctx, invite); err != nil {
		log.Printf("failed to create invite: %v", err)
		return nil, err
	}

	// Return invite with group info populated
	invite.CreatedAt = time.Now()
	invite.UpdatedAt = time.Now()
	return invite, nil
}

// FindByHash finds an invite by its hash
func (s *InviteService) FindByHash(ctx context.Context, hash string) (*domain.Invite, error) {
	invite, err := s.inviteRepo.GetByHash(ctx, hash)
	if err != nil {
		log.Printf("failed to find invite: %v", err)
		return nil, err
	}
	return invite, nil
}

// AcceptInvite accepts an invite and adds the user to the group
func (s *InviteService) AcceptInvite(ctx context.Context, userID int64, inviteHash string) (*AcceptInviteResponseDTO, error) {
	// Get invite with group info
	invite, err := s.inviteRepo.GetByHashWithGroup(ctx, inviteHash)
	if err != nil {
		log.Printf("failed to get invite: %v", err)
		return nil, err
	}

	// Check if invite is expired
	if invite.ExpiresAt != nil && time.Now().After(*invite.ExpiresAt) {
		log.Printf("invite expired")
		return nil, &domain.ValidationError{Message: "This invite link is either invalid or expired."}
	}

	// Check if group exists
	if invite.GroupID == nil {
		return nil, &domain.ValidationError{Message: "invite does not have an associated group"}
	}

	// Check if user already in group
	exists, err := s.userGroupRepo.Exists(ctx, userID, *invite.GroupID)
	if err != nil {
		log.Printf("failed to check user group membership: %v", err)
		return nil, err
	}
	if exists {
		log.Printf("user already in group")
		return nil, &domain.ValidationError{Message: "User has already joined group"}
	}

	// Add user to group
	userGroup := &domain.UserGroup{
		UserID:  userID,
		GroupID: *invite.GroupID,
	}
	if err := s.userGroupRepo.Create(ctx, userGroup); err != nil {
		log.Printf("failed to add user to group: %v", err)
		return nil, err
	}

	// Get channels for the group
	channels, err := s.channelRepo.GetByGroupID(ctx, *invite.GroupID)
	if err != nil {
		log.Printf("failed to get channels: %v", err)
		return nil, err
	}

	channelIDs := make([]int64, len(channels))
	for i, ch := range channels {
		channelIDs[i] = ch.ID
	}

	return &AcceptInviteResponseDTO{
		GroupID:  *invite.GroupID,
		Channels: channelIDs,
	}, nil
}

var _ IInviteService = (*InviteService)(nil)

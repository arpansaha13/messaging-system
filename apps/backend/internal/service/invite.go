package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
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
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("creating invite", zap.Int64("inviter_id", inviterID), zap.Int64("group_id", groupID))

	// Verify group exists
	_, err := s.groupRepo.GetByID(ctx, groupID)
	if err != nil {
		log.Error("failed to verify group existence", zap.Int64("group_id", groupID), zap.Error(err))
		return nil, err
	}

	// Generate unique hash
	hash, err := s.generateHash()
	if err != nil {
		log.Error("failed to generate invite hash", zap.Int64("group_id", groupID), zap.Error(err))
		return nil, &gotoolkit.InternalError{Message: "failed to generate invite", Err: err}
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
		log.Error("failed to create invite in repository", zap.Int64("inviter_id", inviterID), zap.Int64("group_id", groupID), zap.Error(err))
		return nil, err
	}

	// Return invite with group info populated
	invite.CreatedAt = time.Now()
	invite.UpdatedAt = time.Now()

	log.Info("invite created successfully", zap.Int64("inviter_id", inviterID), zap.Int64("group_id", groupID), zap.String("invite_hash", hash[:min(8, len(hash))]))
	return invite, nil
}

// FindByHash finds an invite by its hash
func (s *InviteService) FindByHash(ctx context.Context, hash string) (*domain.Invite, error) {
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("finding invite by hash")

	invite, err := s.inviteRepo.GetByHash(ctx, hash)
	if err != nil {
		log.Warn("invite not found by hash", zap.Error(err))
		return nil, err
	}

	log.Debug("invite found", zap.Int64("group_id", *invite.GroupID), zap.Int64("inviter_id", invite.InviterID))
	return invite, nil
}

// AcceptInvite accepts an invite and adds the user to the group
func (s *InviteService) AcceptInvite(ctx context.Context, userID int64, inviteHash string) (*AcceptInviteResponseDTO, error) {
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("accepting invite", zap.Int64("user_id", userID))

	// Get invite with group info
	invite, err := s.inviteRepo.GetByHashWithGroup(ctx, inviteHash)
	if err != nil {
		log.Error("failed to get invite", zap.Error(err))
		return nil, err
	}

	// Check if invite is expired
	if invite.ExpiresAt != nil && time.Now().After(*invite.ExpiresAt) {
		log.Warn("invite expired for user", zap.Int64("user_id", userID))
		return nil, &gotoolkit.ValidationError{Message: "This invite link is either invalid or expired."}
	}

	// Check if group exists
	if invite.GroupID == nil {
		log.Warn("invite does not have associated group")
		return nil, &gotoolkit.ValidationError{Message: "invite does not have an associated group"}
	}

	// Check if user already in group
	exists, err := s.userGroupRepo.Exists(ctx, userID, *invite.GroupID)
	if err != nil {
		log.Error("failed to check user group membership", zap.Int64("user_id", userID), zap.Int64("group_id", *invite.GroupID), zap.Error(err))
		return nil, err
	}
	if exists {
		log.Warn("user already in group", zap.Int64("user_id", userID), zap.Int64("group_id", *invite.GroupID))
		return nil, &gotoolkit.ValidationError{Message: "User has already joined group"}
	}

	// Add user to group
	userGroup := &domain.UserGroup{
		UserID:  userID,
		GroupID: *invite.GroupID,
	}
	if err := s.userGroupRepo.Create(ctx, userGroup); err != nil {
		log.Error("failed to add user to group", zap.Int64("user_id", userID), zap.Int64("group_id", *invite.GroupID), zap.Error(err))
		return nil, err
	}

	log.Debug("user added to group", zap.Int64("user_id", userID), zap.Int64("group_id", *invite.GroupID))

	// Get channels for the group
	channels, err := s.channelRepo.GetByGroupID(ctx, *invite.GroupID)
	if err != nil {
		log.Error("failed to get channels for group", zap.Int64("group_id", *invite.GroupID), zap.Error(err))
		return nil, err
	}

	log.Info("invite accepted successfully", zap.Int64("user_id", userID), zap.Int64("group_id", *invite.GroupID), zap.Int("channel_count", len(channels)))

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

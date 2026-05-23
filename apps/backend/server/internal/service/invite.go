package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"go.uber.org/zap"
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
func (s *InviteService) CreateInvite(ctx context.Context, req *dto.CreateInviteDTO) (*domain.Invite, error) {
	log := gtk.LoggerFromContext(ctx)
	inviterID := utils.GetUserIDFromCtx(ctx)
	log.Debug("creating invite", zap.Int64("inviter_id", inviterID), zap.Int64("group_id", req.GroupID))

	// Verify group exists
	_, err := s.groupRepo.GetByIDUnscoped(ctx, req.GroupID)
	if err != nil {
		log.Error("failed to verify group existence", zap.Int64("group_id", req.GroupID), zap.Error(err))
		return nil, err
	}

	isMember, err := s.userGroupRepo.Exists(ctx, inviterID, req.GroupID)
	if err != nil {
		log.Error("failed to verify inviter membership", zap.Int64("inviter_id", inviterID), zap.Int64("group_id", req.GroupID), zap.Error(err))
		return nil, err
	}
	if !isMember {
		log.Warn("invite creation forbidden for non-member", zap.Int64("inviter_id", inviterID), zap.Int64("group_id", req.GroupID))
		return nil, &gtk.ForbiddenError{Message: "not a member of this group"}
	}

	// Generate unique hash
	hash, err := s.generateHash()
	if err != nil {
		log.Error("failed to generate invite hash", zap.Int64("group_id", req.GroupID), zap.Error(err))
		return nil, &gtk.InternalError{Message: "failed to generate invite", Err: err}
	}

	// Set expiration to 24 hours from now
	expiresAt := time.Now().Add(24 * time.Hour)

	invite := &domain.Invite{
		Hash:      hash,
		InviterID: inviterID,
		GroupID:   &req.GroupID,
		ExpiresAt: &expiresAt,
	}

	if err := s.inviteRepo.Create(ctx, invite); err != nil {
		log.Error("failed to create invite in repository", zap.Int64("inviter_id", inviterID), zap.Int64("group_id", req.GroupID), zap.Error(err))
		return nil, err
	}

	invite.CreatedAt = time.Now()
	invite.UpdatedAt = time.Now()

	log.Info("invite created successfully", zap.Int64("inviter_id", inviterID), zap.Int64("group_id", req.GroupID), zap.String("invite_hash", hash[:min(8, len(hash))]))
	return invite, nil
}

// FindByHash finds an invite by its hash
func (s *InviteService) FindByHash(ctx context.Context, req *dto.FindInviteDTO) (*domain.Invite, error) {
	log := gtk.LoggerFromContext(ctx)
	log.Debug("finding invite by hash")

	invite, err := s.inviteRepo.GetByHash(ctx, req.Hash)
	if err != nil {
		log.Warn("invite not found by hash", zap.Error(err))
		return nil, err
	}

	log.Debug("invite found", zap.Int64("group_id", *invite.GroupID), zap.Int64("inviter_id", invite.InviterID))
	return invite, nil
}

// AcceptInvite accepts an invite and adds the authenticated user to the group
func (s *InviteService) AcceptInvite(ctx context.Context, input *dto.AcceptInviteInput) (*AcceptInviteResponseDTO, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("accepting invite", zap.Int64("user_id", userID))

	// Get invite with group info
	invite, err := s.inviteRepo.GetByHashWithGroup(ctx, input.InviteHash)
	if err != nil {
		log.Error("failed to get invite", zap.Error(err))
		return nil, err
	}

	// Check if invite is expired
	if invite.ExpiresAt != nil && time.Now().After(*invite.ExpiresAt) {
		log.Warn("invite expired for user", zap.Int64("user_id", userID))
		return nil, &gtk.ValidationError{Message: "This invite link is either invalid or expired."}
	}

	// Check if group exists
	if invite.GroupID == nil {
		log.Warn("invite does not have associated group")
		return nil, &gtk.ValidationError{Message: "invite does not have an associated group"}
	}

	// Check if user already in group
	exists, err := s.userGroupRepo.Exists(ctx, userID, *invite.GroupID)
	if err != nil {
		log.Error("failed to check user group membership", zap.Int64("user_id", userID), zap.Int64("group_id", *invite.GroupID), zap.Error(err))
		return nil, err
	}
	if exists {
		log.Warn("user already in group", zap.Int64("user_id", userID), zap.Int64("group_id", *invite.GroupID))
		return nil, &gtk.ValidationError{Message: "User has already joined group"}
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
	channels, err := s.channelRepo.GetByGroupID(ctx, userID, *invite.GroupID)
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

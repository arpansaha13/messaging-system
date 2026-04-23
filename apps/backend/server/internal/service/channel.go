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

// ChannelService handles channel business logic
type ChannelService struct {
	channelRepo   repository.IChannelRepository
	groupRepo     repository.IGroupRepository
	userGroupRepo repository.IUserGroupRepository
}

// NewChannelService creates a new channel service
func NewChannelService(
	channelRepo repository.IChannelRepository,
	groupRepo repository.IGroupRepository,
	userGroupRepo repository.IUserGroupRepository,
) *ChannelService {
	return &ChannelService{
		channelRepo:   channelRepo,
		groupRepo:     groupRepo,
		userGroupRepo: userGroupRepo,
	}
}

// CreateChannel creates a new channel within a group
func (s *ChannelService) CreateChannel(ctx context.Context, req *dto.CreateChannelDTO) (*domain.Channel, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("creating channel", zap.String("channel_name", req.Name), zap.Int64("group_id", req.GroupID), zap.Int64("user_id", userID))

	isMember, err := s.userGroupRepo.Exists(ctx, userID, req.GroupID)
	if err != nil {
		log.Error("failed to check group membership", zap.Int64("group_id", req.GroupID), zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}
	if !isMember {
		log.Warn("user is not a member of group", zap.Int64("group_id", req.GroupID), zap.Int64("user_id", userID))
		return nil, &gtk.ForbiddenError{Message: "not a member of this group"}
	}

	// Verify group exists
	group, err := s.groupRepo.GetByID(ctx, userID, req.GroupID)
	if err != nil {
		log.Error("failed to verify group existence", zap.Int64("group_id", req.GroupID), zap.Error(err))
		return nil, err
	}

	if group.FounderID != userID {
		log.Warn("user not allowed to create channel", zap.Int64("user_id", userID), zap.Int64("group_id", req.GroupID))
		return nil, &gtk.ValidationError{Message: "not allowed to create channels"}
	}

	channel := &domain.Channel{
		Name:    req.Name,
		GroupID: req.GroupID,
	}

	if err := s.channelRepo.Create(ctx, channel); err != nil {
		log.Error("failed to create channel in repository", zap.String("channel_name", req.Name), zap.Int64("group_id", req.GroupID), zap.Error(err))
		return nil, err
	}

	log.Info("channel created successfully", zap.Int64("channel_id", channel.ID), zap.String("channel_name", req.Name))
	return channel, nil
}

// GetChannels retrieves all channels
func (s *ChannelService) GetChannels(ctx context.Context) ([]*domain.Channel, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("retrieving all channels", zap.Int64("user_id", userID))

	channels, err := s.channelRepo.GetAll(ctx, userID)
	if err != nil {
		log.Error("failed to retrieve all channels", zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}

	log.Debug("channels retrieved successfully", zap.Int64("user_id", userID), zap.Int("channel_count", len(channels)))
	return channels, nil
}

// GetChannelsByGroupID retrieves channels in a specific group
func (s *ChannelService) GetChannelsByGroupID(ctx context.Context, req *dto.GetGroupChannelsDTO) ([]*domain.Channel, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("retrieving channels for group", zap.Int64("group_id", req.GroupID), zap.Int64("user_id", userID))

	isMember, err := s.userGroupRepo.Exists(ctx, userID, req.GroupID)
	if err != nil {
		log.Error("failed to check group membership", zap.Int64("group_id", req.GroupID), zap.Int64("user_id", userID), zap.Error(err))
		return nil, err
	}
	if !isMember {
		log.Warn("user is not a member of group", zap.Int64("group_id", req.GroupID), zap.Int64("user_id", userID))
		return nil, &gtk.ForbiddenError{Message: "not a member of this group"}
	}

	channels, err := s.channelRepo.GetByGroupID(ctx, userID, req.GroupID)
	if err != nil {
		log.Error("failed to retrieve channels for group", zap.Int64("group_id", req.GroupID), zap.Error(err))
		return nil, err
	}

	log.Debug("channels retrieved successfully", zap.Int64("group_id", req.GroupID), zap.Int("channel_count", len(channels)))
	return channels, nil
}

// GetChannelByID retrieves a channel by its ID
func (s *ChannelService) GetChannelByID(ctx context.Context, req *dto.GetChannelInfoDTO) (*domain.Channel, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("retrieving channel by id", zap.Int64("channel_id", req.ChannelID), zap.Int64("user_id", userID))

	channel, err := s.channelRepo.GetByID(ctx, userID, req.ChannelID)
	if err != nil {
		log.Error("failed to retrieve channel by id", zap.Int64("channel_id", req.ChannelID), zap.Error(err))
		return nil, err
	}

	log.Debug("channel retrieved successfully", zap.Int64("channel_id", req.ChannelID), zap.String("channel_name", channel.Name))
	return channel, nil
}

var _ IChannelService = (*ChannelService)(nil)

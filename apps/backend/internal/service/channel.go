package service

import (
	"context"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// ChannelService handles channel business logic
type ChannelService struct {
	channelRepo repository.IChannelRepository
	groupRepo   repository.IGroupRepository
}

// NewChannelService creates a new channel service
func NewChannelService(channelRepo repository.IChannelRepository, groupRepo repository.IGroupRepository) *ChannelService {
	return &ChannelService{
		channelRepo: channelRepo,
		groupRepo:   groupRepo,
	}
}

// CreateChannel creates a new channel within a group
func (s *ChannelService) CreateChannel(ctx context.Context, req *dto.CreateChannelDTO) (*domain.Channel, error) {
	log := logger.FromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("creating channel", zap.String("channel_name", req.Name), zap.Int64("group_id", req.GroupID), zap.Int64("user_id", userID))

	// Verify group exists
	group, err := s.groupRepo.GetByID(ctx, req.GroupID)
	if err != nil {
		log.Error("failed to verify group existence", zap.Int64("group_id", req.GroupID), zap.Error(err))
		return nil, err
	}

	if group.FounderID != userID {
		log.Warn("user not allowed to create channel", zap.Int64("user_id", userID), zap.Int64("group_id", req.GroupID))
		return nil, &gotoolkit.ValidationError{Message: "not allowed to create channels"}
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
	log := logger.FromContext(ctx)
	log.Debug("retrieving all channels")

	channels, err := s.channelRepo.GetAll(ctx)
	if err != nil {
		log.Error("failed to retrieve all channels", zap.Error(err))
		return nil, err
	}

	log.Debug("channels retrieved successfully", zap.Int("channel_count", len(channels)))
	return channels, nil
}

// GetChannelsByGroupID retrieves channels in a specific group
func (s *ChannelService) GetChannelsByGroupID(ctx context.Context, req *dto.GetGroupChannelsDTO) ([]*domain.Channel, error) {
	log := logger.FromContext(ctx)
	log.Debug("retrieving channels for group", zap.Int64("group_id", req.GroupID))

	channels, err := s.channelRepo.GetByGroupID(ctx, req.GroupID)
	if err != nil {
		log.Error("failed to retrieve channels for group", zap.Int64("group_id", req.GroupID), zap.Error(err))
		return nil, err
	}

	log.Debug("channels retrieved successfully", zap.Int64("group_id", req.GroupID), zap.Int("channel_count", len(channels)))
	return channels, nil
}

// GetChannelByID retrieves a channel by its ID
func (s *ChannelService) GetChannelByID(ctx context.Context, req *dto.GetChannelInfoDTO) (*domain.Channel, error) {
	log := logger.FromContext(ctx)
	log.Debug("retrieving channel by id", zap.Int64("channel_id", req.ChannelID))

	channel, err := s.channelRepo.GetByID(ctx, req.ChannelID)
	if err != nil {
		log.Error("failed to retrieve channel by id", zap.Int64("channel_id", req.ChannelID), zap.Error(err))
		return nil, err
	}

	log.Debug("channel retrieved successfully", zap.Int64("channel_id", req.ChannelID), zap.String("channel_name", channel.Name))
	return channel, nil
}

var _ IChannelService = (*ChannelService)(nil)

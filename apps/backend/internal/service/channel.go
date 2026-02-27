package service

import (
	"context"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
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
func (s *ChannelService) CreateChannel(ctx context.Context, name string, groupID int64) (*domain.Channel, error) {
	log := logger.FromContext(ctx)
	log.Debug("creating channel", zap.String("channel_name", name), zap.Int64("group_id", groupID))

	// Verify group exists
	_, err := s.groupRepo.GetByID(ctx, groupID)
	if err != nil {
		log.Error("failed to verify group existence", zap.Int64("group_id", groupID), zap.Error(err))
		return nil, err
	}

	channel := &domain.Channel{
		Name:    name,
		GroupID: groupID,
	}

	if err := s.channelRepo.Create(ctx, channel); err != nil {
		log.Error("failed to create channel in repository", zap.String("channel_name", name), zap.Int64("group_id", groupID), zap.Error(err))
		return nil, err
	}

	log.Info("channel created successfully", zap.Int64("channel_id", channel.ID), zap.String("channel_name", name))
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
func (s *ChannelService) GetChannelsByGroupID(ctx context.Context, groupID int64) ([]*domain.Channel, error) {
	log := logger.FromContext(ctx)
	log.Debug("retrieving channels for group", zap.Int64("group_id", groupID))

	channels, err := s.channelRepo.GetByGroupID(ctx, groupID)
	if err != nil {
		log.Error("failed to retrieve channels for group", zap.Int64("group_id", groupID), zap.Error(err))
		return nil, err
	}

	log.Debug("channels retrieved successfully", zap.Int64("group_id", groupID), zap.Int("channel_count", len(channels)))
	return channels, nil
}

// GetChannelByID retrieves a channel by its ID
func (s *ChannelService) GetChannelByID(ctx context.Context, channelID int64) (*domain.Channel, error) {
	log := logger.FromContext(ctx)
	log.Debug("retrieving channel by id", zap.Int64("channel_id", channelID))

	channel, err := s.channelRepo.GetByID(ctx, channelID)
	if err != nil {
		log.Error("failed to retrieve channel by id", zap.Int64("channel_id", channelID), zap.Error(err))
		return nil, err
	}

	log.Debug("channel retrieved successfully", zap.Int64("channel_id", channelID), zap.String("channel_name", channel.Name))
	return channel, nil
}

var _ IChannelService = (*ChannelService)(nil)

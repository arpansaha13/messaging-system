package service

import (
	"context"
	"log"

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
	// Verify group exists
	_, err := s.groupRepo.GetByID(ctx, groupID)
	if err != nil {
		log.Printf("failed to verify group: %v", err)
		return nil, err
	}

	channel := &domain.Channel{
		Name:    name,
		GroupID: groupID,
	}

	if err := s.channelRepo.Create(ctx, channel); err != nil {
		log.Printf("failed to create channel: %v", err)
		return nil, err
	}

	return channel, nil
}

// GetChannels retrieves all channels
func (s *ChannelService) GetChannels(ctx context.Context) ([]*domain.Channel, error) {
	channels, err := s.channelRepo.GetAll(ctx)
	if err != nil {
		log.Printf("failed to get channels: %v", err)
		return nil, err
	}
	return channels, nil
}

// GetChannelsByGroupID retrieves channels in a specific group
func (s *ChannelService) GetChannelsByGroupID(ctx context.Context, groupID int64) ([]*domain.Channel, error) {
	channels, err := s.channelRepo.GetByGroupID(ctx, groupID)
	if err != nil {
		log.Printf("failed to get channels for group: %v", err)
		return nil, err
	}
	return channels, nil
}

// GetChannelByID retrieves a channel by its ID
func (s *ChannelService) GetChannelByID(ctx context.Context, channelID int64) (*domain.Channel, error) {
	channel, err := s.channelRepo.GetByID(ctx, channelID)
	if err != nil {
		log.Printf("failed to get channel: %v", err)
		return nil, err
	}
	return channel, nil
}

var _ IChannelService = (*ChannelService)(nil)

package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
)

// ChannelRepository handles channel-related database operations
type ChannelRepository struct {
	db *gorm.DB
}

// NewChannelRepository creates a new channel repository
func NewChannelRepository(db *gorm.DB) *ChannelRepository {
	return &ChannelRepository{db: db}
}

// Create creates a new channel
func (r *ChannelRepository) Create(ctx context.Context, channel *domain.Channel) error {
	if err := r.db.WithContext(ctx).Create(channel).Error; err != nil {
		return &domain.InternalError{Message: "failed to create channel", Err: err}
	}
	return nil
}

// GetByID retrieves a channel by ID
func (r *ChannelRepository) GetByID(ctx context.Context, channelID int64) (*domain.Channel, error) {
	var channel domain.Channel
	err := r.db.WithContext(ctx).Where("id = ?", channelID).First(&channel).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &domain.NotFoundError{Message: "channel not found"}
		}
		return nil, &domain.InternalError{Message: "failed to get channel", Err: err}
	}

	return &channel, nil
}

// GetAll retrieves all channels
func (r *ChannelRepository) GetAll(ctx context.Context) ([]*domain.Channel, error) {
	var channels []*domain.Channel
	err := r.db.WithContext(ctx).Find(&channels).Error

	if err != nil {
		return nil, &domain.InternalError{Message: "failed to get channels", Err: err}
	}

	return channels, nil
}

// GetByGroupID retrieves channels within a specific group
func (r *ChannelRepository) GetByGroupID(ctx context.Context, groupID int64) ([]*domain.Channel, error) {
	var channels []*domain.Channel
	err := r.db.WithContext(ctx).Where("group_id = ?", groupID).Find(&channels).Error

	if err != nil {
		return nil, &domain.InternalError{Message: "failed to get group channels", Err: err}
	}

	return channels, nil
}

// Delete deletes a channel
func (r *ChannelRepository) Delete(ctx context.Context, channelID int64) error {
	if err := r.db.WithContext(ctx).Delete(&domain.Channel{}, channelID).Error; err != nil {
		return &domain.InternalError{Message: "failed to delete channel", Err: err}
	}
	return nil
}

// Update updates a channel
func (r *ChannelRepository) Update(ctx context.Context, channel *domain.Channel) error {
	if err := r.db.WithContext(ctx).Save(channel).Error; err != nil {
		return &domain.InternalError{Message: "failed to update channel", Err: err}
	}
	return nil
}

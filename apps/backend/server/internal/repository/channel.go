package repository

import (
	"context"
	"errors"

	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// ChannelRepository handles channel-related database operations
type ChannelRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewChannelRepository creates a new channel repository
func NewChannelRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *ChannelRepository {
	return &ChannelRepository{db: db, cb: cb}
}

// Create creates a new channel
func (r *ChannelRepository) Create(ctx context.Context, channel *domain.Channel) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(channel).Error
	})

	if err != nil {
		return &gotoolkit.InternalError{Message: "failed to create channel", Err: err}
	}
	return nil
}

// GetByID retrieves a channel by ID
func (r *ChannelRepository) GetByID(ctx context.Context, channelID int64) (*domain.Channel, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var channel domain.Channel
		err := r.db.WithContext(ctx).Where("id = ?", channelID).First(&channel).Error
		if err != nil {
			return nil, err
		}
		return &channel, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gotoolkit.NotFoundError{Message: "channel not found"}
		}
		return nil, &gotoolkit.InternalError{Message: "failed to get channel", Err: err}
	}

	return result.(*domain.Channel), nil
}

// GetAll retrieves all channels
func (r *ChannelRepository) GetAll(ctx context.Context) ([]*domain.Channel, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var channels []*domain.Channel
		err := r.db.WithContext(ctx).Find(&channels).Error
		if err != nil {
			return nil, err
		}
		return channels, nil
	})

	if err != nil {
		return nil, &gotoolkit.InternalError{Message: "failed to get channels", Err: err}
	}

	return result.([]*domain.Channel), nil
}

// GetByGroupID retrieves channels within a specific group
func (r *ChannelRepository) GetByGroupID(ctx context.Context, groupID int64) ([]*domain.Channel, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var channels []*domain.Channel
		err := r.db.WithContext(ctx).Where("group_id = ?", groupID).Find(&channels).Error
		if err != nil {
			return nil, err
		}
		return channels, nil
	})

	if err != nil {
		return nil, &gotoolkit.InternalError{Message: "failed to get group channels", Err: err}
	}

	return result.([]*domain.Channel), nil
}

// Delete deletes a channel
func (r *ChannelRepository) Delete(ctx context.Context, channelID int64) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Delete(&domain.Channel{}, channelID).Error
	})

	if err != nil {
		return &gotoolkit.InternalError{Message: "failed to delete channel", Err: err}
	}
	return nil
}

// Update updates a channel
func (r *ChannelRepository) Update(ctx context.Context, channel *domain.Channel) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Save(channel).Error
	})

	if err != nil {
		return &gotoolkit.InternalError{Message: "failed to update channel", Err: err}
	}
	return nil
}

var _ IChannelRepository = (*ChannelRepository)(nil)

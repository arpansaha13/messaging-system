package repository

import (
	"context"
	"errors"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"
)

// ChannelRepository handles channel-related database operations
type ChannelRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

const joinUserGroupsByChannelGroup = "JOIN user_groups ON user_groups.group_id = channels.group_id"

// NewChannelRepository creates a new channel repository
func NewChannelRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *ChannelRepository {
	return &ChannelRepository{db: db, cb: cb}
}

// Create creates a new channel.
//
// This method is intentionally persistence-only and does not enforce
// membership/authorization checks; callers should validate isMember in the
// service layer via userGroupRepo.Exists before invoking it.
func (r *ChannelRepository) Create(ctx context.Context, channel *domain.Channel) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(channel).Error
	})

	if err != nil {
		return &gtk.InternalError{Message: "failed to create channel", Err: err}
	}
	return nil
}

// GetByID retrieves a channel by ID only if the user is a member of its group
func (r *ChannelRepository) GetByID(ctx context.Context, userID, channelID int64) (*domain.Channel, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var channel domain.Channel
		err := r.db.WithContext(ctx).
			Model(&domain.Channel{}).
			Joins(joinUserGroupsByChannelGroup).
			Where("channels.id = ? AND user_groups.user_id = ?", channelID, userID).
			First(&channel).Error
		if err != nil {
			return nil, err
		}
		return &channel, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "channel not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get channel", Err: err}
	}

	return result.(*domain.Channel), nil
}

// GetByIDUnscoped retrieves a channel by ID without user context
func (r *ChannelRepository) GetByIDUnscoped(ctx context.Context, tx *gorm.DB, channelID int64) (*domain.Channel, error) {
	db := r.db
	if tx != nil {
		db = tx
	}
	result, err := r.cb.Execute(func() (any, error) {
		var channel domain.Channel
		err := db.WithContext(ctx).First(&channel, channelID).Error
		if err != nil {
			return nil, err
		}
		return &channel, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "channel not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get channel", Err: err}
	}

	return result.(*domain.Channel), nil
}

// GetAll retrieves all channels where the user belongs to the parent group
func (r *ChannelRepository) GetAll(ctx context.Context, userID int64) ([]*domain.Channel, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var channels []*domain.Channel
		err := r.db.WithContext(ctx).
			Model(&domain.Channel{}).
			Select("DISTINCT channels.*").
			Joins(joinUserGroupsByChannelGroup).
			Where("user_groups.user_id = ?", userID).
			Find(&channels).Error
		if err != nil {
			return nil, err
		}
		return channels, nil
	})

	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to get channels", Err: err}
	}

	return result.([]*domain.Channel), nil
}

// GetByGroupID retrieves channels in a group only if the user is a member of that group
func (r *ChannelRepository) GetByGroupID(ctx context.Context, userID, groupID int64) ([]*domain.Channel, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var channels []*domain.Channel
		err := r.db.WithContext(ctx).
			Model(&domain.Channel{}).
			Select("DISTINCT channels.*").
			Joins(joinUserGroupsByChannelGroup).
			Where("channels.group_id = ? AND user_groups.user_id = ?", groupID, userID).
			Find(&channels).Error
		if err != nil {
			return nil, err
		}
		return channels, nil
	})

	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to get group channels", Err: err}
	}

	return result.([]*domain.Channel), nil
}

var _ IChannelRepository = (*ChannelRepository)(nil)

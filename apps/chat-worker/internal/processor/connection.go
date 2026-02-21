package processor

import (
	"context"
	"fmt"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// ConnectionProcessor handles user connection events and subscription data
type ConnectionProcessor struct {
	db     *gorm.DB
	broker broker.MessageBroker
}

// NewConnectionProcessor creates a new connection processor
func NewConnectionProcessor(db *gorm.DB, broker broker.MessageBroker) *ConnectionProcessor {
	return &ConnectionProcessor{
		db:     db,
		broker: broker,
	}
}

// ProcessUserConnection handles user connection events
func (cp *ConnectionProcessor) ProcessUserConnection(ctx context.Context, payload *broker.UserConnectionPayload) error {
	log := logger.FromContext(ctx)
	log.Debug("processing user connection", zap.Int64("user_id", payload.UserId), zap.String("server_id", payload.ServerId))

	// Fetch group IDs for the user
	var userGroups []domain.UserGroup
	if err := cp.db.Where("user_id = ?", payload.UserId).Find(&userGroups).Error; err != nil {
		log.Error("failed to fetch user groups", zap.Int64("user_id", payload.UserId), zap.Error(err))
		return fmt.Errorf("failed to fetch user groups: %w", err)
	}

	groupIDs := make([]int64, len(userGroups))
	for i, ug := range userGroups {
		groupIDs[i] = ug.GroupID
	}

	if len(groupIDs) == 0 {
		log.Debug("no groups found for user", zap.Int64("user_id", payload.UserId))
	}

	// Fetch channels for each group
	var channels []domain.Channel
	if len(groupIDs) > 0 {
		if err := cp.db.Where("group_id IN ?", groupIDs).Find(&channels).Error; err != nil {
			log.Error("failed to fetch channels", zap.Int("group_count", len(groupIDs)), zap.Error(err))
			return fmt.Errorf("failed to fetch channels: %w", err)
		}
	}

	channelIDs := make([]int64, len(channels))
	for i, ch := range channels {
		channelIDs[i] = ch.ID
	}

	// Publish subscription data to the server
	if err := cp.broker.PublishToSubscription(payload.ServerId, map[string]any{
		"userId":     payload.UserId,
		"groupIds":   groupIDs,
		"channelIds": channelIDs,
	}); err != nil {
		log.Error("failed to publish subscription data", zap.String("server_id", payload.ServerId), zap.Error(err))
	}

	log.Info("connection processed", zap.Int64("user_id", payload.UserId), zap.String("server_id", payload.ServerId), zap.Int("group_count", len(groupIDs)), zap.Int("channel_count", len(channelIDs)))
	return nil
}

package processor

import (
	"fmt"
	"log"

	"github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
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
func (cp *ConnectionProcessor) ProcessUserConnection(payload *broker.UserConnectionPayload) error {
	// Fetch group IDs for the user
	var userGroups []domain.UserGroup
	if err := cp.db.Where("user_id = ?", payload.UserId).Find(&userGroups).Error; err != nil {
		return fmt.Errorf("failed to fetch user groups: %w", err)
	}

	groupIDs := make([]int64, len(userGroups))
	for i, ug := range userGroups {
		groupIDs[i] = ug.GroupID
	}

	// Fetch channels for each group
	var channels []domain.Channel
	if len(groupIDs) > 0 {
		if err := cp.db.Where("group_id IN ?", groupIDs).Find(&channels).Error; err != nil {
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
		log.Printf("failed to publish subscription data: %v", err)
	}

	return nil
}

package processor

import (
	"fmt"
	"log"
	"strconv"

	"github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"gorm.io/gorm"
)

// StatusProcessor handles message status updates (delivered, read)
type StatusProcessor struct {
	db     *gorm.DB
	broker broker.MessageBroker
}

// NewStatusProcessor creates a new status processor
func NewStatusProcessor(db *gorm.DB, broker broker.MessageBroker) *StatusProcessor {
	return &StatusProcessor{
		db:     db,
		broker: broker,
	}
}

// ProcessDelivered handles message delivered status updates
func (sp *StatusProcessor) ProcessDelivered(payload *broker.DeliveredPayload) error {
	// Update message recipient status
	result := sp.db.Model(&domain.MessageRecipient{}).
		Where("message_id = ? AND receiver_id = ?", payload.MessageId, payload.ReceiverId).
		Update("status", domain.MessageStatusDelivered)
	if result.Error != nil {
		return fmt.Errorf("failed to update message status: %w", result.Error)
	}

	// Only publish if a row was actually updated
	if result.RowsAffected == 0 {
		return nil
	}

	// Publish DELIVERED event to sender
	if err := sp.broker.PublishToOutgoing(strconv.FormatInt(payload.SenderId, 10), map[string]any{
		"event":  "personal:delivered",
		"userId": payload.SenderId,
		"data": map[string]any{
			"messageId":  payload.MessageId,
			"receiverId": payload.ReceiverId,
			"status":     domain.MessageStatusDelivered,
		},
	}); err != nil {
		log.Printf("failed to publish DELIVERED event: %v", err)
	}

	return nil
}

// ProcessRead handles message read status updates
func (sp *StatusProcessor) ProcessRead(payloads []broker.ReadPayload) error {
	if len(payloads) == 0 {
		return nil
	}

	// Build bulk update query using OR conditions for multiple message-receiver pairs
	query := sp.db.Model(&domain.MessageRecipient{})
	for i, payload := range payloads {
		if i == 0 {
			query = query.Where("(message_id = ? AND receiver_id = ?)", payload.MessageId, payload.ReceiverId)
		} else {
			query = query.Or("(message_id = ? AND receiver_id = ?)", payload.MessageId, payload.ReceiverId)
		}
	}

	// Execute single bulk update for all message recipients
	if err := query.Update("status", domain.MessageStatusRead).Error; err != nil {
		log.Printf("failed to bulk update message status: %v", err)
	}

	// Group payloads by sender ID for bulk emit
	senderGroups := make(map[int64][]map[string]any)
	for _, payload := range payloads {
		readData := map[string]any{
			"messageId":  payload.MessageId,
			"receiverId": payload.ReceiverId,
			"status":     domain.MessageStatusRead,
		}
		senderGroups[payload.SenderId] = append(senderGroups[payload.SenderId], readData)
	}

	// Publish bulk READ events per sender
	for senderId, readPayloads := range senderGroups {
		if err := sp.broker.PublishToOutgoing(strconv.FormatInt(senderId, 10), map[string]any{
			"event":  "personal:read",
			"userId": senderId,
			"data":   readPayloads,
		}); err != nil {
			log.Printf("failed to publish READ event: %v", err)
		}
	}

	return nil
}

package processor

import (
	"context"
	"fmt"
	"strconv"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/broker"
	commonbr "github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// StatusProcessor handles message status updates (delivered, read)
type StatusProcessor struct {
	db     *gorm.DB
	broker broker.ChatBroker
	cb     *gobreaker.CircuitBreaker[any]
}

// NewStatusProcessor creates a new status processor
func NewStatusProcessor(db *gorm.DB, broker broker.ChatBroker, cb *gobreaker.CircuitBreaker[any]) *StatusProcessor {
	return &StatusProcessor{
		db:     db,
		broker: broker,
		cb:     cb,
	}
}

// ProcessDelivered handles message delivered status updates
func (sp *StatusProcessor) ProcessDelivered(ctx context.Context, payload *commonbr.DeliveredPayload) error {
	log := gtk.LoggerFromContext(ctx)
	log.Debug("processing delivered status", zap.Int64("message_id", payload.MessageId), zap.Int64("receiver_id", payload.ReceiverId), zap.Int64("sender_id", payload.SenderId))

	_, err := sp.cb.Execute(func() (any, error) {
		// Update message recipient status
		result := sp.db.Model(&domain.MessageRecipient{}).
			Where("message_id = ? AND receiver_id = ?", payload.MessageId, payload.ReceiverId).
			Update("status", domain.MessageStatusDelivered)
		if result.Error != nil {
			log.Error("failed to update message status", zap.Int64("message_id", payload.MessageId), zap.Int64("receiver_id", payload.ReceiverId), zap.Error(result.Error))
			return nil, fmt.Errorf("failed to update message status: %w", result.Error)
		}

		// Only publish if a row was actually updated
		if result.RowsAffected == 0 {
			log.Debug("no recipient found, skipping", zap.Int64("message_id", payload.MessageId), zap.Int64("receiver_id", payload.ReceiverId))
			return nil, nil
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
			log.Error("failed to publish DELIVERED event", zap.Int64("sender_id", payload.SenderId), zap.Error(err))
		}

		log.Info("status updated", zap.Int64("message_id", payload.MessageId), zap.Int64("receiver_id", payload.ReceiverId))
		return nil, nil
	})

	return err
}

// ProcessRead handles message read status updates
func (sp *StatusProcessor) ProcessRead(ctx context.Context, payloads []commonbr.ReadPayload) error {
	log := gtk.LoggerFromContext(ctx)
	log.Debug("processing read status", zap.Int("payload_count", len(payloads)))

	if len(payloads) == 0 {
		return nil
	}

	_, err := sp.cb.Execute(func() (any, error) {
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
			log.Error("failed to bulk update message status", zap.Int("payload_count", len(payloads)), zap.Error(err))
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
				log.Error("failed to publish READ event", zap.Int64("sender_id", senderId), zap.Error(err))
			}
		}

		log.Info("read status processed", zap.Int("total_messages", len(payloads)))
		return nil, nil
	})

	return err
}

package processor

import (
	"context"
	"strconv"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"go.uber.org/zap"
)

// MessageProcessor forwards pre-persisted messages to the outgoing exchange
type MessageProcessor struct {
	broker broker.MessageBroker
}

// NewMessageProcessor creates a new message processor
func NewMessageProcessor(broker broker.MessageBroker) *MessageProcessor {
	return &MessageProcessor{broker: broker}
}

// ForwardPersonalMessage publishes a pre-persisted personal message to the recipient's socket connection
func (mp *MessageProcessor) ForwardPersonalMessage(ctx context.Context, payload *broker.ForwardPersonalMessagePayload) error {
	log := logger.FromContext(ctx)
	log.Debug("forwarding personal message", zap.Int64("message_id", payload.MessageId), zap.Int64("receiver_id", payload.ReceiverId))

	if err := mp.broker.PublishToOutgoing(strconv.FormatInt(payload.ReceiverId, 10), map[string]any{
		"event":  "personal:receive-message",
		"userId": payload.ReceiverId,
		"data": map[string]any{
			"messageId": payload.MessageId,
			"content":   payload.Content,
			"senderId":  payload.SenderId,
			"createdAt": payload.CreatedAt,
			"status":    domain.MessageStatusSent,
		},
	}); err != nil {
		log.Error("failed to publish receive event", zap.Int64("receiver_id", payload.ReceiverId), zap.Error(err))
		return err
	}

	log.Info("personal message forwarded", zap.Int64("message_id", payload.MessageId), zap.Int64("receiver_id", payload.ReceiverId))
	return nil
}

// ForwardGroupMessage publishes a pre-persisted group message to the channel and notifies the sender
func (mp *MessageProcessor) ForwardGroupMessage(ctx context.Context, payload *broker.ForwardGroupMessagePayload) error {
	log := logger.FromContext(ctx)
	log.Debug("forwarding group message", zap.Int64("message_id", payload.MessageId), zap.Int64("channel_id", payload.ChannelId))

	// Notify sender so the temp message can be confirmed with the real message ID
	if err := mp.broker.PublishToOutgoing(strconv.FormatInt(payload.SenderId, 10), map[string]any{
		"event":  "group:sent",
		"userId": payload.SenderId,
		"data": map[string]any{
			"hash":      payload.Hash,
			"messageId": payload.MessageId,
			"groupId":   payload.GroupId,
			"channelId": payload.ChannelId,
			"createdAt": payload.CreatedAt,
			"status":    domain.MessageStatusSent,
		},
	}); err != nil {
		log.Error("failed to publish group:sent event", zap.Int64("sender_id", payload.SenderId), zap.Error(err))
	}

	// Broadcast to all channel subscribers
	routingKey := "channel:" + strconv.FormatInt(payload.ChannelId, 10)
	if err := mp.broker.PublishToOutgoing(routingKey, map[string]any{
		"event":     "group:receive-message",
		"channelId": payload.ChannelId,
		"data": map[string]any{
			"channelId": payload.ChannelId,
			"groupId":   payload.GroupId,
			"messageId": payload.MessageId,
			"content":   payload.Content,
			"senderId":  payload.SenderId,
			"createdAt": payload.CreatedAt,
			"status":    domain.MessageStatusSent,
		},
	}); err != nil {
		log.Error("failed to publish group:receive-message event", zap.Int64("channel_id", payload.ChannelId), zap.Error(err))
		return err
	}

	log.Info("group message forwarded", zap.Int64("message_id", payload.MessageId), zap.Int64("channel_id", payload.ChannelId))
	return nil
}

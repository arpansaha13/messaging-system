package processor

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/sony/gobreaker/v2"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// MessageProcessor handles message send events (personal and group)
type MessageProcessor struct {
	db     *gorm.DB
	broker broker.MessageBroker
	cb     *gobreaker.CircuitBreaker[any]
}

// NewMessageProcessor creates a new message processor
func NewMessageProcessor(db *gorm.DB, broker broker.MessageBroker, cb *gobreaker.CircuitBreaker[any]) *MessageProcessor {
	return &MessageProcessor{
		db:     db,
		broker: broker,
		cb:     cb,
	}
}

// ProcessPersonalMessage handles personal message sends
func (mp *MessageProcessor) ProcessPersonalMessage(ctx context.Context, payload *broker.PersonalMessagePayload) error {
	log := logger.FromContext(ctx)
	log.Debug("processing personal message", zap.Int64("sender_id", payload.SenderId), zap.Int64("receiver_id", payload.ReceiverId))

	_, err := mp.cb.Execute(func() (any, error) {
		return nil, mp.db.Transaction(func(tx *gorm.DB) error {
		// Fetch sender and receiver
		var sender, receiver domain.UserProfile
		if err := tx.First(&sender, payload.SenderId).Error; err != nil {
			log.Error("failed to fetch sender", zap.Int64("sender_id", payload.SenderId), zap.Error(err))
			return fmt.Errorf("sender not found: %w", err)
		}

		if err := tx.First(&receiver, payload.ReceiverId).Error; err != nil {
			log.Error("failed to fetch receiver", zap.Int64("receiver_id", payload.ReceiverId), zap.Error(err))
			return fmt.Errorf("receiver not found: %w", err)
		}

		// Create chats if they don't exist
		senderToReceiverChat := &domain.Chat{
			SenderID:   payload.SenderId,
			ReceiverID: payload.ReceiverId,
			ClearedAt:  &time.Time{},
		}
		if err := tx.FirstOrCreate(senderToReceiverChat, domain.Chat{
			SenderID:   payload.SenderId,
			ReceiverID: payload.ReceiverId,
		}).Error; err != nil {
			return fmt.Errorf("failed to ensure sender-to-receiver chat: %w", err)
		}

		receiverToSenderChat := &domain.Chat{
			SenderID:   payload.ReceiverId,
			ReceiverID: payload.SenderId,
			ClearedAt:  &time.Time{},
		}
		if err := tx.FirstOrCreate(receiverToSenderChat, domain.Chat{
			SenderID:   payload.ReceiverId,
			ReceiverID: payload.SenderId,
		}).Error; err != nil {
			return fmt.Errorf("failed to ensure receiver-to-sender chat: %w", err)
		}

		// Create message
		now := time.Now()
		message := &domain.Message{
			SenderID:  payload.SenderId,
			Sender:    &sender,
			Content:   payload.Content,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if err := tx.Create(message).Error; err != nil {
			return fmt.Errorf("failed to create message: %w", err)
		}

		// Create message recipient
		messageRecipient := &domain.MessageRecipient{
			MessageID:  message.ID,
			Message:    message,
			ReceiverID: payload.ReceiverId,
			Receiver:   &receiver,
			Status:     domain.MessageStatusSent,
			CreatedAt:  now,
			UpdatedAt:  now,
		}
		if err := tx.Create(messageRecipient).Error; err != nil {
			return fmt.Errorf("failed to create message recipient: %w", err)
		}

		// Publish SENT event to sender
		if err := mp.broker.PublishToOutgoing(strconv.FormatInt(payload.SenderId, 10), map[string]any{
			"event":  "personal:sent",
			"userId": payload.SenderId,
			"data": map[string]any{
				"hash":       payload.Hash,
				"messageId":  message.ID,
				"createdAt":  message.CreatedAt,
				"receiverId": payload.ReceiverId,
				"status":     domain.MessageStatusSent,
			},
		}); err != nil {
			log.Error("failed to publish SENT event", zap.Int64("sender_id", payload.SenderId), zap.Error(err))
		}

		// Publish message to receiver
		if err := mp.broker.PublishToOutgoing(strconv.FormatInt(payload.ReceiverId, 10), map[string]any{
			"event":  "personal:receive-message",
			"userId": payload.ReceiverId,
			"data": map[string]any{
				"messageId": message.ID,
				"content":   payload.Content,
				"senderId":  payload.SenderId,
				"createdAt": message.CreatedAt,
				"status":    domain.MessageStatusSent,
			},
		}); err != nil {
			log.Error("failed to publish MESSAGE_RECEIVE event", zap.Int64("receiver_id", payload.ReceiverId), zap.Error(err))
		}

		log.Info("personal message processed", zap.Int64("sender_id", payload.SenderId), zap.Int64("receiver_id", payload.ReceiverId), zap.Int64("message_id", message.ID))
		return nil
	})
	})
	return err
}

// ProcessGroupMessage handles group message sends
func (mp *MessageProcessor) ProcessGroupMessage(ctx context.Context, payload *broker.GroupMessagePayload) error {
	log := logger.FromContext(ctx)
	log.Debug("processing group message", zap.Int64("sender_id", payload.SenderId), zap.Int64("group_id", payload.GroupId), zap.Int64("channel_id", payload.ChannelId))

	_, err := mp.cb.Execute(func() (any, error) {
		return nil, mp.db.Transaction(func(tx *gorm.DB) error {
		// Fetch sender and channel
		var sender domain.UserProfile
		if err := tx.First(&sender, payload.SenderId).Error; err != nil {
			log.Error("failed to fetch sender", zap.Int64("sender_id", payload.SenderId), zap.Error(err))
			return fmt.Errorf("sender not found: %w", err)
		}

		var channel domain.Channel
		if err := tx.First(&channel, payload.ChannelId).Error; err != nil {
			log.Error("failed to fetch channel", zap.Int64("channel_id", payload.ChannelId), zap.Error(err))
			return fmt.Errorf("channel not found: %w", err)
		}

		// Get all members of the group except the sender
		var userGroups []domain.UserGroup
		if err := tx.Preload("User").Where("group_id = ? AND user_id != ?", payload.GroupId, payload.SenderId).
			Find(&userGroups).Error; err != nil {
			return fmt.Errorf("failed to fetch group members: %w", err)
		}

		// Save the main message record
		now := time.Now()
		message := &domain.Message{
			SenderID:  payload.SenderId,
			Sender:    &sender,
			ChannelID: &payload.ChannelId,
			Channel:   &channel,
			Content:   payload.Content,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if err := tx.Create(message).Error; err != nil {
			return fmt.Errorf("failed to create message: %w", err)
		}

		// Bulk create recipient records for tracking message status
		// TODO: Bulk create
		for _, ug := range userGroups {
			messageRecipient := &domain.MessageRecipient{
				MessageID:  message.ID,
				Message:    message,
				ReceiverID: ug.UserID,
				Receiver:   ug.User,
				Status:     domain.MessageStatusSent,
				CreatedAt:  now,
				UpdatedAt:  now,
			}
			if err := tx.Create(messageRecipient).Error; err != nil {
				log.Error("failed to create message recipient", zap.Int64("user_id", ug.UserID), zap.Error(err))
			}
		}

		// Publish SENT event to sender so temp message can be confirmed
		if err := mp.broker.PublishToOutgoing(strconv.FormatInt(payload.SenderId, 10), map[string]any{
			"event":  "group:sent",
			"userId": payload.SenderId,
			"data": map[string]any{
				"hash":      payload.Hash,
				"messageId": message.ID,
				"groupId":   payload.GroupId,
				"channelId": payload.ChannelId,
				"createdAt": message.CreatedAt,
				"status":    domain.MessageStatusSent,
			},
		}); err != nil {
			log.Error("failed to publish GROUP SENT event", zap.Int64("sender_id", payload.SenderId), zap.Error(err))
		}

		// Publish message to channel using channelId as routing key
		// RabbitMQ will route to all server queues that have a binding for this channelId
		// Each server that has users subscribed to this channel will receive the message
		routingKey := "channel:" + strconv.FormatInt(payload.ChannelId, 10)
		if err := mp.broker.PublishToOutgoing(routingKey, map[string]any{
			"event":     "group:receive-message",
			"channelId": payload.ChannelId,
			"data": map[string]any{
				"channelId": payload.ChannelId,
				"groupId":   payload.GroupId,
				"messageId": message.ID,
				"content":   payload.Content,
				"senderId":  payload.SenderId,
				"createdAt": message.CreatedAt,
				"status":    domain.MessageStatusSent,
			},
		}); err != nil {
			log.Error("failed to publish message to channel", zap.Int64("channel_id", payload.ChannelId), zap.Error(err))
		}

		log.Info("group message processed", zap.Int64("sender_id", payload.SenderId), zap.Int64("group_id", payload.GroupId), zap.Int64("channel_id", payload.ChannelId), zap.Int64("message_id", message.ID), zap.Int("recipient_count", len(userGroups)))
		return nil
	})
	})
	return err
}

package processor

import (
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"gorm.io/gorm"
)

// MessageProcessor handles message send events (personal and group)
type MessageProcessor struct {
	db     *gorm.DB
	broker broker.MessageBroker
}

// NewMessageProcessor creates a new message processor
func NewMessageProcessor(db *gorm.DB, broker broker.MessageBroker) *MessageProcessor {
	return &MessageProcessor{
		db:     db,
		broker: broker,
	}
}

// ProcessPersonalMessage handles personal message sends
func (mp *MessageProcessor) ProcessPersonalMessage(payload *broker.PersonalMessagePayload) error {
	return mp.db.Transaction(func(tx *gorm.DB) error {
		// Fetch sender and receiver
		var sender, receiver domain.UserProfile
		if err := tx.First(&sender, payload.SenderId).Error; err != nil {
			return fmt.Errorf("sender not found: %w", err)
		}

		if err := tx.First(&receiver, payload.ReceiverId).Error; err != nil {
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
			log.Printf("failed to publish SENT event: %v", err)
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
			log.Printf("failed to publish MESSAGE_RECEIVE event: %v", err)
		}

		return nil
	})
}

// ProcessGroupMessage handles group message sends
func (mp *MessageProcessor) ProcessGroupMessage(payload *broker.GroupMessagePayload) error {
	return mp.db.Transaction(func(tx *gorm.DB) error {
		// Fetch sender and channel
		var sender domain.UserProfile
		if err := tx.First(&sender, payload.SenderId).Error; err != nil {
			return fmt.Errorf("sender not found: %w", err)
		}

		var channel domain.Channel
		if err := tx.First(&channel, payload.ChannelId).Error; err != nil {
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
				log.Printf("failed to create message recipient for user %d: %v", ug.UserID, err)
			}
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
			log.Printf("failed to publish message to channel %d: %v", payload.ChannelId, err)
		}

		return nil
	})
}

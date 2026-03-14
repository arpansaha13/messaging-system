package service

import (
	"context"
	"fmt"
	"time"

	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// MessageService handles message business logic
type MessageService struct {
	messageRepo          repository.IMessageRepository
	messageRecipientRepo repository.IMessageRecipientRepository
	chatRepo             repository.IChatRepository
	rabbitmqService      *RabbitMQService
	db                   *gorm.DB
	cb                   *gobreaker.CircuitBreaker[any]
}

// NewMessageService creates a new message service
func NewMessageService(
	messageRepo repository.IMessageRepository,
	messageRecipientRepo repository.IMessageRecipientRepository,
	chatRepo repository.IChatRepository,
	rabbitmqService *RabbitMQService,
	db *gorm.DB,
	cb *gobreaker.CircuitBreaker[any],
) *MessageService {
	return &MessageService{
		messageRepo:          messageRepo,
		messageRecipientRepo: messageRecipientRepo,
		chatRepo:             chatRepo,
		rabbitmqService:      rabbitmqService,
		db:                   db,
		cb:                   cb,
	}
}

// SendPersonalMessage persists a personal message and enqueues it for delivery to the recipient.
// Returns the persisted message ID and creation timestamp so the caller can echo them back to the sender.
func (s *MessageService) SendPersonalMessage(ctx context.Context, senderID, receiverID int64, content, hash string) (int64, time.Time, error) {
	log := logger.FromContext(ctx)
	log.Debug("sending personal message", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID), zap.Int("content_length", len(content)))

	if !s.rabbitmqService.IsConnected() {
		log.Error("RabbitMQ not connected for personal message send", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID))
		return 0, time.Time{}, &gotoolkit.InternalError{Message: "RabbitMQ not connected"}
	}

	var messageID int64
	var createdAt time.Time

	_, err := s.cb.Execute(func() (any, error) {
		return nil, s.db.Transaction(func(tx *gorm.DB) error {
			zero := time.Time{}

			// Ensure both chat rows exist (sender→receiver and receiver→sender)
			senderChat := &domain.Chat{SenderID: senderID, ReceiverID: receiverID, ClearedAt: &zero}
			if err := tx.FirstOrCreate(senderChat, domain.Chat{SenderID: senderID, ReceiverID: receiverID}).Error; err != nil {
				return fmt.Errorf("failed to ensure sender-to-receiver chat: %w", err)
			}

			receiverChat := &domain.Chat{SenderID: receiverID, ReceiverID: senderID, ClearedAt: &zero}
			if err := tx.FirstOrCreate(receiverChat, domain.Chat{SenderID: receiverID, ReceiverID: senderID}).Error; err != nil {
				return fmt.Errorf("failed to ensure receiver-to-sender chat: %w", err)
			}

			// Persist message
			message := &domain.Message{
				SenderID: senderID,
				Content:  content,
			}
			if err := tx.Create(message).Error; err != nil {
				return fmt.Errorf("failed to create message: %w", err)
			}

			messageID = message.ID
			createdAt = message.CreatedAt

			// Persist recipient record
			recipient := &domain.MessageRecipient{
				MessageID:  message.ID,
				ReceiverID: receiverID,
				Status:     domain.MessageStatusSent,
			}
			if err := tx.Create(recipient).Error; err != nil {
				return fmt.Errorf("failed to create message recipient: %w", err)
			}

			return nil
		})
	})
	if err != nil {
		log.Error("failed to persist personal message", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID), zap.Error(err))
		return 0, time.Time{}, err
	}

	// Enqueue forward event so the chat-worker can push it to the recipient's socket
	forwardPayload := ForwardPersonalMessagePayload{
		MessageID:  messageID,
		SenderID:   senderID,
		ReceiverID: receiverID,
		Content:    content,
		CreatedAt:  createdAt,
	}
	if err := s.rabbitmqService.PublishToIncoming("personal.message", RabbitMQMessage{
		Type:    "MESSAGE_FORWARD",
		Payload: forwardPayload,
	}); err != nil {
		log.Error("failed to enqueue forward event", zap.Int64("sender_id", senderID), zap.Int64("message_id", messageID), zap.Error(err))
		return 0, time.Time{}, err
	}

	log.Info("personal message persisted and queued for delivery", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID), zap.Int64("message_id", messageID))
	return messageID, createdAt, nil
}

// SendGroupMessage persists a group message and enqueues it for delivery to the channel.
// Returns the persisted message ID and creation timestamp so the caller can echo them back to the sender.
func (s *MessageService) SendGroupMessage(ctx context.Context, senderID, groupID, channelID int64, content, hash string) (int64, time.Time, error) {
	log := logger.FromContext(ctx)
	log.Debug("sending group message", zap.Int64("sender_id", senderID), zap.Int64("group_id", groupID), zap.Int64("channel_id", channelID), zap.Int("content_length", len(content)))

	if !s.rabbitmqService.IsConnected() {
		log.Error("RabbitMQ not connected for group message send", zap.Int64("sender_id", senderID), zap.Int64("group_id", groupID), zap.Int64("channel_id", channelID))
		return 0, time.Time{}, &gotoolkit.InternalError{Message: "RabbitMQ not connected"}
	}

	var messageID int64
	var createdAt time.Time

	_, err := s.cb.Execute(func() (any, error) {
		return nil, s.db.Transaction(func(tx *gorm.DB) error {
			// Verify channel exists
			var channel domain.Channel
			if err := tx.First(&channel, channelID).Error; err != nil {
				return fmt.Errorf("channel not found: %w", err)
			}

			// Fetch group members excluding the sender
			var userGroups []domain.UserGroup
			if err := tx.Where("group_id = ? AND user_id != ?", groupID, senderID).Find(&userGroups).Error; err != nil {
				return fmt.Errorf("failed to fetch group members: %w", err)
			}

			// Persist message
			message := &domain.Message{
				SenderID:  senderID,
				ChannelID: &channelID,
				Content:   content,
			}
			if err := tx.Create(message).Error; err != nil {
				return fmt.Errorf("failed to create message: %w", err)
			}

			messageID = message.ID
			createdAt = message.CreatedAt

			// Persist recipient records for all members except the sender
			for _, ug := range userGroups {
				recipient := &domain.MessageRecipient{
					MessageID:  message.ID,
					ReceiverID: ug.UserID,
					Status:     domain.MessageStatusSent,
				}
				if err := tx.Create(recipient).Error; err != nil {
					log.Error("failed to create message recipient", zap.Int64("user_id", ug.UserID), zap.Error(err))
				}
			}

			return nil
		})
	})
	if err != nil {
		log.Error("failed to persist group message", zap.Int64("sender_id", senderID), zap.Int64("group_id", groupID), zap.Error(err))
		return 0, time.Time{}, err
	}

	// Enqueue forward event so the chat-worker can push it to the channel subscribers
	forwardPayload := ForwardGroupMessagePayload{
		MessageID: messageID,
		SenderID:  senderID,
		GroupID:   groupID,
		ChannelID: channelID,
		Content:   content,
		Hash:      hash,
		CreatedAt: createdAt,
	}
	if err := s.rabbitmqService.PublishToIncoming("group.message", RabbitMQMessage{
		Type:    "MESSAGE_FORWARD",
		Payload: forwardPayload,
	}); err != nil {
		log.Error("failed to enqueue group forward event", zap.Int64("sender_id", senderID), zap.Int64("message_id", messageID), zap.Error(err))
		return 0, time.Time{}, err
	}

	log.Info("group message persisted and queued for delivery", zap.Int64("sender_id", senderID), zap.Int64("group_id", groupID), zap.Int64("channel_id", channelID), zap.Int64("message_id", messageID))
	return messageID, createdAt, nil
}

// GetMessages retrieves messages between two users using cursor-based pagination
func (s *MessageService) GetMessages(ctx context.Context, userID, receiverID int64, before, after *int64) (*repository.MessagePage, error) {
	log := logger.FromContext(ctx)
	log.Debug("retrieving messages", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID))

	page, err := s.messageRepo.GetMessagesByUserId(ctx, userID, receiverID, nil, before, after)
	if err != nil {
		log.Error("failed to get messages", zap.Int64("user_id", userID), zap.Int64("receiver_id", receiverID), zap.Error(err))
		return nil, err
	}

	log.Debug("messages retrieved successfully", zap.Int64("user_id", userID), zap.Int("message_count", len(page.Messages)))
	return page, nil
}

// MarkMessageAsDelivered publishes a delivered status update to RabbitMQ
func (s *MessageService) MarkMessageAsDelivered(ctx context.Context, messageID, receiverID, senderID int64) error {
	log := logger.FromContext(ctx)
	log.Debug("marking message as delivered", zap.Int64("message_id", messageID), zap.Int64("receiver_id", receiverID))

	if !s.rabbitmqService.IsConnected() {
		log.Error("RabbitMQ not connected for delivered status", zap.Int64("message_id", messageID))
		return &gotoolkit.InternalError{Message: "RabbitMQ not connected"}
	}

	payload := DeliveredPayload{
		MessageID:  messageID,
		ReceiverID: receiverID,
		SenderID:   senderID,
	}

	message := RabbitMQMessage{
		Type:    "STATUS_DELIVERED",
		Payload: payload,
	}

	err := s.rabbitmqService.PublishToIncoming("personal.delivered", message)
	if err != nil {
		log.Error("failed to publish delivered status", zap.Int64("message_id", messageID), zap.Error(err))
		return err
	}

	log.Debug("delivered status published", zap.Int64("message_id", messageID))
	return nil
}

// MarkMessageAsRead publishes read status updates to RabbitMQ
func (s *MessageService) MarkMessageAsRead(ctx context.Context, messages []ReadPayload) error {
	log := logger.FromContext(ctx)
	log.Debug("marking messages as read", zap.Int("message_count", len(messages)))

	if !s.rabbitmqService.IsConnected() {
		log.Error("RabbitMQ not connected for read status")
		return &gotoolkit.InternalError{Message: "RabbitMQ not connected"}
	}

	message := RabbitMQMessage{
		Type:    "STATUS_READ",
		Payload: messages,
	}

	err := s.rabbitmqService.PublishToIncoming("personal.read", message)
	if err != nil {
		log.Error("failed to publish read status", zap.Int("message_count", len(messages)), zap.Error(err))
		return err
	}

	log.Info("read status published successfully", zap.Int("message_count", len(messages)))
	return nil
}

// GetChannelMessages retrieves messages for a channel using cursor-based pagination
func (s *MessageService) GetChannelMessages(ctx context.Context, channelID int64, before, after *int64) (*repository.ChannelMessagePage, error) {
	log := logger.FromContext(ctx)
	log.Debug("retrieving channel messages", zap.Int64("channel_id", channelID))

	page, err := s.messageRepo.GetMessagesByChannelID(ctx, channelID, before, after)
	if err != nil {
		log.Error("failed to retrieve channel messages", zap.Int64("channel_id", channelID), zap.Error(err))
		return nil, err
	}

	log.Debug("channel messages retrieved successfully", zap.Int64("channel_id", channelID), zap.Int("message_count", len(page.Messages)))
	return page, nil
}

var _ IMessageService = (*MessageService)(nil)

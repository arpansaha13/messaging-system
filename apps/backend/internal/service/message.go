package service

import (
	"context"

	"go.uber.org/zap"

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
}

// NewMessageService creates a new message service
func NewMessageService(messageRepo repository.IMessageRepository, messageRecipientRepo repository.IMessageRecipientRepository, chatRepo repository.IChatRepository, rabbitmqService *RabbitMQService) *MessageService {
	return &MessageService{
		messageRepo:          messageRepo,
		messageRecipientRepo: messageRecipientRepo,
		chatRepo:             chatRepo,
		rabbitmqService:      rabbitmqService,
	}
}

// SendPersonalMessage publishes a personal message to RabbitMQ for processing
func (s *MessageService) SendPersonalMessage(ctx context.Context, senderID, receiverID int64, content, hash string) error {
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("sending personal message", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID), zap.Int("content_length", len(content)))

	if !s.rabbitmqService.IsConnected() {
		log.Error("RabbitMQ not connected for personal message send", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID))
		return &domain.InternalError{Message: "RabbitMQ not connected"}
	}

	payload := PersonalMessagePayload{
		SenderID:   senderID,
		ReceiverID: receiverID,
		Content:    content,
		Hash:       hash,
	}

	message := RabbitMQMessage{
		Type:    "MESSAGE_SEND",
		Payload: payload,
	}

	err := s.rabbitmqService.PublishToIncoming("personal.message", message)
	if err != nil {
		log.Error("failed to publish personal message", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID), zap.Error(err))
		return err
	}

	log.Info("personal message published to RabbitMQ", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID))
	return nil
}

// SendGroupMessage publishes a group message to RabbitMQ for processing
func (s *MessageService) SendGroupMessage(ctx context.Context, senderID, groupID, channelID int64, content, hash string) error {
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("sending group message", zap.Int64("sender_id", senderID), zap.Int64("group_id", groupID), zap.Int64("channel_id", channelID), zap.Int("content_length", len(content)))

	if !s.rabbitmqService.IsConnected() {
		log.Error("RabbitMQ not connected for group message send", zap.Int64("sender_id", senderID), zap.Int64("group_id", groupID), zap.Int64("channel_id", channelID))
		return &domain.InternalError{Message: "RabbitMQ not connected"}
	}

	payload := GroupMessagePayload{
		SenderID:  senderID,
		GroupID:   groupID,
		ChannelID: channelID,
		Content:   content,
		Hash:      hash,
	}

	message := RabbitMQMessage{
		Type:    "MESSAGE_SEND",
		Payload: payload,
	}

	err := s.rabbitmqService.PublishToIncoming("group.message", message)
	if err != nil {
		log.Error("failed to publish group message", zap.Int64("sender_id", senderID), zap.Int64("group_id", groupID), zap.Error(err))
		return err
	}

	log.Info("group message published to RabbitMQ", zap.Int64("sender_id", senderID), zap.Int64("group_id", groupID), zap.Int64("channel_id", channelID))
	return nil
}

// GetMessages retrieves messages between two users using cursor-based pagination
func (s *MessageService) GetMessages(ctx context.Context, userID, receiverID int64, before, after *int64) (*repository.MessagePage, error) {
	log := logger.FromContext(ctx).Ctx(ctx)
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
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("marking message as delivered", zap.Int64("message_id", messageID), zap.Int64("receiver_id", receiverID))

	if !s.rabbitmqService.IsConnected() {
		log.Error("RabbitMQ not connected for delivered status", zap.Int64("message_id", messageID))
		return &domain.InternalError{Message: "RabbitMQ not connected"}
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
	log := logger.FromContext(ctx).Ctx(ctx)
	log.Debug("marking messages as read", zap.Int("message_count", len(messages)))

	if !s.rabbitmqService.IsConnected() {
		log.Error("RabbitMQ not connected for read status")
		return &domain.InternalError{Message: "RabbitMQ not connected"}
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
	log := logger.FromContext(ctx).Ctx(ctx)
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

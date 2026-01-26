package service

import (
	"context"
	"log"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository"
)

// MessageService handles message business logic
type MessageService struct {
	messageRepo          *repository.MessageRepository
	messageRecipientRepo *repository.MessageRecipientRepository
	chatRepo             *repository.ChatRepository
	rabbitmqService      *RabbitMQService
}

// NewMessageService creates a new message service
func NewMessageService(messageRepo *repository.MessageRepository, messageRecipientRepo *repository.MessageRecipientRepository, chatRepo *repository.ChatRepository, rabbitmqService *RabbitMQService) *MessageService {
	return &MessageService{
		messageRepo:          messageRepo,
		messageRecipientRepo: messageRecipientRepo,
		chatRepo:             chatRepo,
		rabbitmqService:      rabbitmqService,
	}
}

// SendPersonalMessage publishes a personal message to RabbitMQ for processing
func (s *MessageService) SendPersonalMessage(ctx context.Context, senderID, receiverID int64, content, hash string) error {
	if !s.rabbitmqService.IsConnected() {
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
		log.Printf("failed to publish personal message: %v", err)
		return err
	}

	return nil
}

// SendGroupMessage publishes a group message to RabbitMQ for processing
func (s *MessageService) SendGroupMessage(ctx context.Context, senderID, groupID, channelID int64, content, hash string) error {
	if !s.rabbitmqService.IsConnected() {
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
		log.Printf("failed to publish group message: %v", err)
		return err
	}

	return nil
}

// GetMessages retrieves messages between two users
func (s *MessageService) GetMessages(ctx context.Context, userID, receiverID int64, limit, offset int) ([]*repository.MessageWithStatus, error) {
	messages, err := s.messageRepo.GetMessagesByUserId(ctx, userID, receiverID, nil, limit, offset)
	if err != nil {
		log.Printf("failed to get messages: %v", err)
		return nil, err
	}
	return messages, nil
}

// MarkMessageAsDelivered publishes a delivered status update to RabbitMQ
func (s *MessageService) MarkMessageAsDelivered(ctx context.Context, messageID, receiverID, senderID int64) error {
	if !s.rabbitmqService.IsConnected() {
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
		log.Printf("failed to publish delivered status: %v", err)
		return err
	}

	return nil
}

// MarkMessageAsRead publishes read status updates to RabbitMQ
func (s *MessageService) MarkMessageAsRead(ctx context.Context, messages []ReadPayload) error {
	if !s.rabbitmqService.IsConnected() {
		return &domain.InternalError{Message: "RabbitMQ not connected"}
	}

	message := RabbitMQMessage{
		Type:    "STATUS_READ",
		Payload: messages,
	}

	err := s.rabbitmqService.PublishToIncoming("personal.read", message)
	if err != nil {
		log.Printf("failed to publish read status: %v", err)
		return err
	}

	return nil
}

// GetChannelMessages retrieves messages for a channel
func (s *MessageService) GetChannelMessages(ctx context.Context, channelID int64, limit, offset int) ([]*domain.Message, error) {
	messages, err := s.messageRepo.GetMessagesByChannelID(ctx, channelID, limit, offset)
	if err != nil {
		log.Printf("failed to get channel messages: %v", err)
		return nil, err
	}
	return messages, nil
}

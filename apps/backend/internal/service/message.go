package service

import (
	"context"
	"fmt"
	"strconv"
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

	// Publish to the recipient's socket server queue via the outgoing exchange
	if err := s.rabbitmqService.PublishToOutgoing(strconv.FormatInt(receiverID, 10), map[string]any{
		"event":  "personal:receive-message",
		"userId": receiverID,
		"data": map[string]any{
			"messageId": messageID,
			"content":   content,
			"senderId":  senderID,
			"createdAt": createdAt,
			"status":    domain.MessageStatusSent,
		},
	}); err != nil {
		log.Error("failed to publish receive event to outgoing exchange", zap.Int64("sender_id", senderID), zap.Int64("message_id", messageID), zap.Error(err))
		return 0, time.Time{}, err
	}

	log.Info("personal message persisted and forwarded to socket server", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID), zap.Int64("message_id", messageID))
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

	// Publish to the channel room via the outgoing exchange
	if err := s.rabbitmqService.PublishToOutgoing("channel:"+strconv.FormatInt(channelID, 10), map[string]any{
		"event":     "group:receive-message",
		"channelId": channelID,
		"data": map[string]any{
			"messageId": messageID,
			"content":   content,
			"senderId":  senderID,
			"channelId": channelID,
			"groupId":   groupID,
			"createdAt": createdAt,
			"status":    domain.MessageStatusSent,
		},
	}); err != nil {
		log.Error("failed to publish receive event to outgoing exchange", zap.Int64("sender_id", senderID), zap.Int64("message_id", messageID), zap.Error(err))
		return 0, time.Time{}, err
	}

	log.Info("group message persisted and forwarded to socket server", zap.Int64("sender_id", senderID), zap.Int64("group_id", groupID), zap.Int64("channel_id", channelID), zap.Int64("message_id", messageID))
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

// MarkMessageAsDelivered verifies the authenticated receiver owns the recipient record,
// derives senderID from the DB, then publishes a delivered status update to RabbitMQ.
func (s *MessageService) MarkMessageAsDelivered(ctx context.Context, messageID, receiverID int64) error {
	log := logger.FromContext(ctx)
	log.Debug("marking message as delivered", zap.Int64("message_id", messageID), zap.Int64("receiver_id", receiverID))

	if !s.rabbitmqService.IsConnected() {
		log.Error("RabbitMQ not connected for delivered status", zap.Int64("message_id", messageID))
		return &gotoolkit.InternalError{Message: "RabbitMQ not connected"}
	}

	// Verify the authenticated user is the actual recipient of this message.
	if _, err := s.messageRecipientRepo.GetByMessageAndReceiver(ctx, messageID, receiverID); err != nil {
		if gotoolkit.IsNotFound(err) {
			log.Warn("delivered status rejected: caller is not the recipient", zap.Int64("message_id", messageID), zap.Int64("receiver_id", receiverID))
			return &gotoolkit.ForbiddenError{Message: "not a recipient of this message"}
		}
		log.Error("failed to verify message recipient for delivered status", zap.Int64("message_id", messageID), zap.Int64("receiver_id", receiverID), zap.Error(err))
		return err
	}

	// Derive senderID from the message record — never trust client-supplied values.
	msg, err := s.messageRepo.GetByID(ctx, messageID)
	if err != nil {
		log.Error("failed to get message for delivered status", zap.Int64("message_id", messageID), zap.Error(err))
		return err
	}

	payload := DeliveredPayload{
		MessageID:  messageID,
		ReceiverID: receiverID,
		SenderID:   msg.SenderID,
	}

	message := RabbitMQMessage{
		Type:    "STATUS_DELIVERED",
		Payload: payload,
	}

	if err := s.rabbitmqService.PublishToIncoming("personal.delivered", message); err != nil {
		log.Error("failed to publish delivered status", zap.Int64("message_id", messageID), zap.Error(err))
		return err
	}

	log.Debug("delivered status published", zap.Int64("message_id", messageID))
	return nil
}

// MarkMessageAsRead batch-verifies the authenticated receiver owns each recipient record,
// derives senderIDs from the DB, then publishes read status updates to RabbitMQ.
// Messages that cannot be verified (stale frontend state) are silently dropped.
func (s *MessageService) MarkMessageAsRead(ctx context.Context, inputs []MarkReadInput) error {
	log := logger.FromContext(ctx)
	log.Debug("marking messages as read", zap.Int("message_count", len(inputs)))

	if !s.rabbitmqService.IsConnected() {
		log.Error("RabbitMQ not connected for read status")
		return &gotoolkit.InternalError{Message: "RabbitMQ not connected"}
	}

	if len(inputs) == 0 {
		return nil
	}

	// All inputs share the same receiverID (set by the handler from context).
	receiverID := inputs[0].ReceiverID

	messageIDs := make([]int64, len(inputs))
	for i, inp := range inputs {
		messageIDs[i] = inp.MessageID
	}

	// Batch-verify: only process messages where the caller is the actual recipient.
	recipients, err := s.messageRecipientRepo.GetByMessageIDsAndReceiver(ctx, messageIDs, receiverID)
	if err != nil {
		log.Error("failed to verify message recipients for read status", zap.Error(err))
		return err
	}

	verifiedIDs := make(map[int64]struct{}, len(recipients))
	for _, r := range recipients {
		verifiedIDs[r.MessageID] = struct{}{}
	}

	// Warn about any unverified messageIDs (stale frontend state).
	for _, id := range messageIDs {
		if _, ok := verifiedIDs[id]; !ok {
			log.Warn("message recipient not found for read status; skipping", zap.Int64("message_id", id), zap.Int64("receiver_id", receiverID))
		}
	}

	if len(verifiedIDs) == 0 {
		return nil
	}

	verifiedMessageIDs := make([]int64, 0, len(verifiedIDs))
	for id := range verifiedIDs {
		verifiedMessageIDs = append(verifiedMessageIDs, id)
	}

	// Derive senderIDs from the messages table — never trust client-supplied values.
	msgs, err := s.messageRepo.GetByIDs(ctx, verifiedMessageIDs)
	if err != nil {
		log.Error("failed to get messages for read status", zap.Error(err))
		return err
	}

	senderByMessageID := make(map[int64]int64, len(msgs))
	for _, msg := range msgs {
		senderByMessageID[msg.ID] = msg.SenderID
	}

	readPayloads := make([]ReadPayload, 0, len(msgs))
	for _, msg := range msgs {
		readPayloads = append(readPayloads, ReadPayload{
			MessageID:  msg.ID,
			SenderID:   senderByMessageID[msg.ID],
			ReceiverID: receiverID,
		})
	}

	if len(readPayloads) == 0 {
		return nil
	}

	rmqMsg := RabbitMQMessage{
		Type:    "STATUS_READ",
		Payload: readPayloads,
	}

	if err := s.rabbitmqService.PublishToIncoming("personal.read", rmqMsg); err != nil {
		log.Error("failed to publish read status", zap.Int("message_count", len(readPayloads)), zap.Error(err))
		return err
	}

	log.Info("read status published successfully", zap.Int("message_count", len(readPayloads)))
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

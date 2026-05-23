package service

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/utils"
	commonbr "github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// MessageService handles message business logic
type MessageService struct {
	messageRepo          repository.IMessageRepository
	messageRecipientRepo repository.IMessageRecipientRepository
	chatRepo             repository.IChatRepository
	userGroupRepo        repository.IUserGroupRepository
	channelRepo          repository.IChannelRepository
	userClient           IUserServiceClient
	chatBroker           broker.ChatBroker
	cb                   *gobreaker.CircuitBreaker[any]
}

// NewMessageService creates a new message service
func NewMessageService(
	messageRepo repository.IMessageRepository,
	messageRecipientRepo repository.IMessageRecipientRepository,
	chatRepo repository.IChatRepository,
	userGroupRepo repository.IUserGroupRepository,
	channelRepo repository.IChannelRepository,
	userClient IUserServiceClient,
	chatBroker broker.ChatBroker,
	cb *gobreaker.CircuitBreaker[any],
) *MessageService {
	return &MessageService{
		messageRepo:          messageRepo,
		messageRecipientRepo: messageRecipientRepo,
		chatRepo:             chatRepo,
		userGroupRepo:        userGroupRepo,
		channelRepo:          channelRepo,
		userClient:           userClient,
		chatBroker:           chatBroker,
		cb:                   cb,
	}
}

// SendPersonalMessage persists a personal message and enqueues it for delivery to the recipient.
// Returns the persisted message ID and creation timestamp so the caller can echo them back to the sender.
func (s *MessageService) SendPersonalMessage(ctx context.Context, req *dto.SendPersonalMessageDTO) (int64, time.Time, error) {
	log := gtk.LoggerFromContext(ctx)
	senderID := utils.GetUserIDFromCtx(ctx)
	log.Debug("sending personal message", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", req.ReceiverID), zap.Int("content_length", len(req.Content)))

	if !s.chatBroker.IsConnected() {
		log.Error("RabbitMQ not connected for personal message send", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", req.ReceiverID))
		return 0, time.Time{}, &gtk.InternalError{Message: "RabbitMQ not connected"}
	}

	var messageID int64
	var createdAt time.Time

	_, err := s.cb.Execute(func() (any, error) {
		return nil, s.messageRepo.Transaction(ctx, func(tx *gorm.DB) error {
			zero := time.Time{}

			senderChat := &domain.Chat{SenderID: senderID, ReceiverID: req.ReceiverID, ClearedAt: &zero}
			if err := s.chatRepo.FirstOrCreate(ctx, tx, senderChat); err != nil {
				return fmt.Errorf("failed to ensure sender-to-receiver chat: %w", err)
			}

			receiverChat := &domain.Chat{SenderID: req.ReceiverID, ReceiverID: senderID, ClearedAt: &zero}
			if err := s.chatRepo.FirstOrCreate(ctx, tx, receiverChat); err != nil {
				return fmt.Errorf("failed to ensure receiver-to-sender chat: %w", err)
			}

			message := &domain.Message{
				SenderID: senderID,
				Content:  req.Content,
			}
			if err := s.messageRepo.Create(ctx, tx, message); err != nil {
				return fmt.Errorf("failed to create message: %w", err)
			}

			messageID = message.ID
			createdAt = message.CreatedAt

			recipient := &domain.MessageRecipient{
				MessageID:  message.ID,
				ReceiverID: req.ReceiverID,
				Status:     domain.MessageStatusSent,
			}
			if err := s.messageRecipientRepo.Create(ctx, tx, recipient); err != nil {
				return fmt.Errorf("failed to create message recipient: %w", err)
			}

			return nil
		})
	})
	if err != nil {
		log.Error("failed to persist personal message", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
		return 0, time.Time{}, err
	}

	if err := s.chatBroker.PublishToOutgoing(strconv.FormatInt(req.ReceiverID, 10), map[string]any{
		"event":  "personal:receive-message",
		"userId": req.ReceiverID,
		"data": map[string]any{
			"messageId": messageID,
			"content":   req.Content,
			"senderId":  senderID,
			"createdAt": createdAt,
			"status":    domain.MessageStatusSent,
		},
	}); err != nil {
		log.Error("failed to publish receive event to outgoing exchange", zap.Int64("sender_id", senderID), zap.Int64("message_id", messageID), zap.Error(err))
		return 0, time.Time{}, err
	}

	log.Info("personal message persisted and forwarded to socket server", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", req.ReceiverID), zap.Int64("message_id", messageID))
	return messageID, createdAt, nil
}

// SendGroupMessage persists a group message and enqueues it for delivery to the channel.
// Returns the persisted message ID and creation timestamp so the caller can echo them back to the sender.
func (s *MessageService) SendGroupMessage(ctx context.Context, req *dto.SendGroupMessageDTO) (int64, time.Time, error) {
	log := gtk.LoggerFromContext(ctx)
	senderID := utils.GetUserIDFromCtx(ctx)
	log.Debug("sending group message", zap.Int64("sender_id", senderID), zap.Int64("group_id", req.GroupID), zap.Int64("channel_id", req.ChannelID), zap.Int("content_length", len(req.Content)))

	isMember, err := s.userGroupRepo.Exists(ctx, senderID, req.GroupID)
	if err != nil {
		log.Error("failed to verify sender membership for group message", zap.Int64("sender_id", senderID), zap.Int64("group_id", req.GroupID), zap.Error(err))
		return 0, time.Time{}, err
	}
	if !isMember {
		log.Warn("group message send forbidden for non-member", zap.Int64("sender_id", senderID), zap.Int64("group_id", req.GroupID))
		return 0, time.Time{}, &gtk.ForbiddenError{Message: "not a member of this group"}
	}

	channel, err := s.channelRepo.GetByIDUnscoped(ctx, nil, req.ChannelID)
	if err != nil {
		return 0, time.Time{}, err
	}

	if channel.GroupID != req.GroupID {
		log.Warn("group message send rejected: channel does not belong to group",
			zap.Int64("channel_id", req.ChannelID),
			zap.Int64("req_group_id", req.GroupID),
			zap.Int64("actual_group_id", channel.GroupID))
		return 0, time.Time{}, &gtk.ForbiddenError{Message: "channel does not belong to the specified group"}
	}

	if !s.chatBroker.IsConnected() {
		log.Error("RabbitMQ not connected for group message send", zap.Int64("sender_id", senderID), zap.Int64("group_id", req.GroupID), zap.Int64("channel_id", req.ChannelID))
		return 0, time.Time{}, &gtk.InternalError{Message: "RabbitMQ not connected"}
	}

	var messageID int64
	var createdAt time.Time

	_, err = s.cb.Execute(func() (any, error) {
		return nil, s.messageRepo.Transaction(ctx, func(tx *gorm.DB) error {
			userGroups, err := s.userGroupRepo.GetGroupMembersExceptSender(ctx, tx, req.GroupID, senderID)
			if err != nil {
				return fmt.Errorf("failed to fetch group members: %w", err)
			}

			message := &domain.Message{
				SenderID:  senderID,
				ChannelID: &req.ChannelID,
				Content:   req.Content,
			}
			if err := s.messageRepo.Create(ctx, tx, message); err != nil {
				return fmt.Errorf("failed to create message: %w", err)
			}

			messageID = message.ID
			createdAt = message.CreatedAt

			for _, ug := range userGroups {
				recipient := &domain.MessageRecipient{
					MessageID:  message.ID,
					ReceiverID: ug.UserID,
					Status:     domain.MessageStatusSent,
				}
				if err := s.messageRecipientRepo.Create(ctx, tx, recipient); err != nil {
					log.Error("failed to create message recipient", zap.Int64("user_id", ug.UserID), zap.Error(err))
				}
			}

			return nil
		})
	})
	if err != nil {
		log.Error("failed to persist group message", zap.Int64("sender_id", senderID), zap.Int64("group_id", req.GroupID), zap.Error(err))
		return 0, time.Time{}, err
	}

	if err := s.chatBroker.PublishToOutgoing("channel:"+strconv.FormatInt(req.ChannelID, 10), map[string]any{
		"event":     "group:receive-message",
		"channelId": req.ChannelID,
		"data": map[string]any{
			"messageId": messageID,
			"content":   req.Content,
			"senderId":  senderID,
			"channelId": req.ChannelID,
			"groupId":   req.GroupID,
			"createdAt": createdAt,
			"status":    domain.MessageStatusSent,
		},
	}); err != nil {
		log.Error("failed to publish receive event to outgoing exchange", zap.Int64("sender_id", senderID), zap.Int64("message_id", messageID), zap.Error(err))
		return 0, time.Time{}, err
	}

	log.Info("group message persisted and forwarded to socket server", zap.Int64("sender_id", senderID), zap.Int64("group_id", req.GroupID), zap.Int64("channel_id", req.ChannelID), zap.Int64("message_id", messageID))
	return messageID, createdAt, nil
}

// GetMessages retrieves messages between the authenticated user and a receiver using cursor-based pagination
func (s *MessageService) GetMessages(ctx context.Context, req *dto.GetMessagesDTO) (*repository.MessagePage, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("retrieving messages", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID))

	page, err := s.messageRepo.GetMessagesByUserId(ctx, userID, req.ReceiverID, nil, req.Before, req.After)
	if err != nil {
		log.Error("failed to get messages", zap.Int64("user_id", userID), zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
		return nil, err
	}

	log.Debug("messages retrieved successfully", zap.Int64("user_id", userID), zap.Int("message_count", len(page.Messages)))
	return page, nil
}

// MarkMessageAsDelivered verifies the authenticated receiver owns the recipient record,
// derives senderID from the DB, then publishes a delivered status update to RabbitMQ.
func (s *MessageService) MarkMessageAsDelivered(ctx context.Context, req *dto.HandleDeliveredDTO) error {
	log := gtk.LoggerFromContext(ctx)
	receiverID := utils.GetUserIDFromCtx(ctx)
	log.Debug("marking message as delivered", zap.Int64("message_id", req.MessageID), zap.Int64("receiver_id", receiverID))

	if !s.chatBroker.IsConnected() {
		log.Error("RabbitMQ not connected for delivered status", zap.Int64("message_id", req.MessageID))
		return &gtk.InternalError{Message: "RabbitMQ not connected"}
	}

	if _, err := s.messageRecipientRepo.GetByMessageAndReceiver(ctx, req.MessageID, receiverID); err != nil {
		if gtk.IsNotFound(err) {
			log.Warn("delivered status rejected: caller is not the recipient", zap.Int64("message_id", req.MessageID), zap.Int64("receiver_id", receiverID))
			return &gtk.ForbiddenError{Message: "not a recipient of this message"}
		}
		log.Error("failed to verify message recipient for delivered status", zap.Int64("message_id", req.MessageID), zap.Int64("receiver_id", receiverID), zap.Error(err))
		return err
	}

	msg, err := s.messageRepo.GetByID(ctx, req.MessageID)
	if err != nil {
		log.Error("failed to get message for delivered status", zap.Int64("message_id", req.MessageID), zap.Error(err))
		return err
	}

	payload := commonbr.DeliveredPayload{
		MessageId:  req.MessageID,
		ReceiverId: receiverID,
		SenderId:   msg.SenderID,
	}

	message := commonbr.MessagePayload{
		Type:    "STATUS_DELIVERED",
		Payload: payload,
	}

	if err := s.chatBroker.PublishToIncoming("personal.delivered", message); err != nil {
		log.Error("failed to publish delivered status", zap.Int64("message_id", req.MessageID), zap.Error(err))
		return err
	}

	log.Debug("delivered status published", zap.Int64("message_id", req.MessageID))
	return nil
}

// MarkMessageAsRead batch-verifies the authenticated receiver owns each recipient record,
// derives senderIDs from the DB, then publishes read status updates to RabbitMQ.
// Messages that cannot be verified (stale frontend state) are silently dropped.
func (s *MessageService) MarkMessageAsRead(ctx context.Context, req *dto.HandleReadMultipleDTO) error {
	log := gtk.LoggerFromContext(ctx)
	receiverID := utils.GetUserIDFromCtx(ctx)
	log.Debug("marking messages as read", zap.Int("message_count", len(req.Messages)))

	if !s.chatBroker.IsConnected() {
		log.Error("RabbitMQ not connected for read status")
		return &gtk.InternalError{Message: "RabbitMQ not connected"}
	}

	if len(req.Messages) == 0 {
		return nil
	}

	messageIDs := make([]int64, len(req.Messages))
	for i, item := range req.Messages {
		messageIDs[i] = item.MessageID
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

	msgs, err := s.messageRepo.GetByIDs(ctx, verifiedMessageIDs)
	if err != nil {
		log.Error("failed to get messages for read status", zap.Error(err))
		return err
	}

	senderByMessageID := make(map[int64]int64, len(msgs))
	for _, msg := range msgs {
		senderByMessageID[msg.ID] = msg.SenderID
	}

	readPayloads := make([]commonbr.ReadPayload, 0, len(msgs))
	for _, msg := range msgs {
		readPayloads = append(readPayloads, commonbr.ReadPayload{
			MessageId:  msg.ID,
			SenderId:   senderByMessageID[msg.ID],
			ReceiverId: receiverID,
		})
	}

	if len(readPayloads) == 0 {
		return nil
	}

	rmqMsg := commonbr.MessagePayload{
		Type:    "STATUS_READ",
		Payload: readPayloads,
	}

	if err := s.chatBroker.PublishToIncoming("personal.read", rmqMsg); err != nil {
		log.Error("failed to publish read status", zap.Int("message_count", len(readPayloads)), zap.Error(err))
		return err
	}

	log.Info("read status published successfully", zap.Int("message_count", len(readPayloads)))
	return nil
}

// GetChannelMessages retrieves messages for a channel using cursor-based pagination
func (s *MessageService) GetChannelMessages(ctx context.Context, req *dto.GetChannelMessagesDTO) (*repository.ChannelMessagePage, error) {
	log := gtk.LoggerFromContext(ctx)
	userID := utils.GetUserIDFromCtx(ctx)
	log.Debug("retrieving channel messages", zap.Int64("channel_id", req.ChannelID), zap.Int64("user_id", userID))

	// Verify membership
	channel, err := s.channelRepo.GetByIDUnscoped(ctx, nil, req.ChannelID)
	if err != nil {
		return nil, err
	}

	isMember, err := s.userGroupRepo.Exists(ctx, userID, channel.GroupID)
	if err != nil {
		return nil, fmt.Errorf("failed to verify membership: %w", err)
	}
	if !isMember {
		log.Warn("channel messages retrieval forbidden for non-member", zap.Int64("user_id", userID), zap.Int64("channel_id", req.ChannelID))
		return nil, &gtk.ForbiddenError{Message: "not a member of the group owning this channel"}
	}

	page, err := s.messageRepo.GetMessagesByChannelID(ctx, req.ChannelID, req.Before, req.After)
	if err != nil {
		log.Error("failed to retrieve channel messages", zap.Int64("channel_id", req.ChannelID), zap.Error(err))
		return nil, err
	}

	if len(page.Messages) > 0 {
		// Hydrate senders
		senderIDsMap := make(map[int64]struct{})
		for _, m := range page.Messages {
			senderIDsMap[m.SenderID] = struct{}{}
		}

		senderIDs := make([]int64, 0, len(senderIDsMap))
		for id := range senderIDsMap {
			senderIDs = append(senderIDs, id)
		}

		profiles, err := s.userClient.GetDomainProfiles(ctx, senderIDs)
		if err != nil {
			log.Warn("failed to fetch sender profiles for channel messages", zap.Error(err))
			// Continue with unpopulated senders
		} else {
			for _, m := range page.Messages {
				if p, ok := profiles[m.SenderID]; ok {
					m.Sender = p
				}
			}
		}
	}

	log.Debug("channel messages retrieved and hydrated successfully", zap.Int64("channel_id", req.ChannelID), zap.Int("message_count", len(page.Messages)))
	return page, nil
}

var _ IMessageService = (*MessageService)(nil)

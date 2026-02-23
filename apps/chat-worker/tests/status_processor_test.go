package tests

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/suite"

	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/processor"
	"github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

type StatusProcessorTestSuite struct {
	BaseTestSuite
	processor *processor.StatusProcessor
}

func (s *StatusProcessorTestSuite) SetupTest() {
	s.BaseTestSuite.SetupTest()
	s.processor = processor.NewStatusProcessor(s.DB, s.Broker)
}

func (s *StatusProcessorTestSuite) TestProcessDelivered_Success() {
	// Seed users and message
	sender := s.SeedUser(1, "alice")
	receiver := s.SeedUser(2, "bob")

	chat := s.SeedChat(sender.ID, receiver.ID)
	_ = chat

	// Create message and recipient
	message := &domain.Message{
		SenderID: sender.ID,
		Content:  "Hello!",
	}
	result := s.DB.Create(message)
	s.Require().NoError(result.Error)

	recipient := &domain.MessageRecipient{
		MessageID:  message.ID,
		ReceiverID: receiver.ID,
		Status:     domain.MessageStatusSent,
	}
	result = s.DB.Create(recipient)
	s.Require().NoError(result.Error)

	// Process delivered status
	payload := &broker.DeliveredPayload{
		MessageId:  message.ID,
		ReceiverId: receiver.ID,
		SenderId:   sender.ID,
	}

	err := s.processor.ProcessDelivered(context.TODO(), payload)
	s.Require().NoError(err)

	// Verify status updated
	var updated domain.MessageRecipient
	result = s.DB.Where("message_id = ? AND receiver_id = ?", message.ID, receiver.ID).First(&updated)
	s.Require().NoError(result.Error)
	s.Require().Equal(domain.MessageStatusDelivered, updated.Status)

	// Verify event published to sender
	deliveredMessages := s.GetPublishedByRoutingKey("1") // sender.ID (routing key)
	s.Require().Len(deliveredMessages, 1)

	var eventPayload map[string]any
	payloadBytes, _ := json.Marshal(deliveredMessages[0].Message)
	json.Unmarshal(payloadBytes, &eventPayload)
	s.Require().Equal("personal:delivered", eventPayload["event"])
	s.Require().Equal(float64(sender.ID), eventPayload["userId"])

	// Verify data contains message status
	dataMap := eventPayload["data"].(map[string]any)
	s.Require().Equal(float64(message.ID), dataMap["messageId"])
	s.Require().Equal(float64(receiver.ID), dataMap["receiverId"])
}

func (s *StatusProcessorTestSuite) TestProcessDelivered_NoRecipient() {
	sender := s.SeedUser(1, "alice")
	receiver := s.SeedUser(2, "bob")

	payload := &broker.DeliveredPayload{
		MessageId:  999,
		ReceiverId: receiver.ID,
		SenderId:   sender.ID,
	}

	// Should not error - just silently do nothing
	err := s.processor.ProcessDelivered(context.TODO(), payload)
	s.Require().NoError(err)

	// Verify no event published
	deliveredMessages := s.GetPublishedByRoutingKey("1") // sender.ID (routing key)
	s.Require().Len(deliveredMessages, 0)
}

func (s *StatusProcessorTestSuite) TestProcessRead_Single() {
	// Seed users and message
	sender := s.SeedUser(1, "alice")
	receiver := s.SeedUser(2, "bob")

	chat := s.SeedChat(sender.ID, receiver.ID)
	_ = chat

	// Create message and recipient with DELIVERED status
	message := &domain.Message{
		SenderID: sender.ID,
		Content:  "Hello!",
	}
	result := s.DB.Create(message)
	s.Require().NoError(result.Error)

	recipient := &domain.MessageRecipient{
		MessageID:  message.ID,
		ReceiverID: receiver.ID,
		Status:     domain.MessageStatusDelivered,
	}
	result = s.DB.Create(recipient)
	s.Require().NoError(result.Error)

	// Process read status
	payloads := []broker.ReadPayload{
		{
			MessageId:  message.ID,
			SenderId:   sender.ID,
			ReceiverId: receiver.ID,
		},
	}

	err := s.processor.ProcessRead(context.TODO(), payloads)
	s.Require().NoError(err)

	// Verify status updated to READ
	var updated domain.MessageRecipient
	result = s.DB.Where("message_id = ? AND receiver_id = ?", message.ID, receiver.ID).First(&updated)
	s.Require().NoError(result.Error)
	s.Require().Equal(domain.MessageStatusRead, updated.Status)

	// Verify event published to sender
	readMessages := s.GetPublishedByRoutingKey("1") // sender.ID (routing key)
	s.Require().Len(readMessages, 1)

	var eventPayload map[string]any
	payloadBytes, _ := json.Marshal(readMessages[0].Message)
	json.Unmarshal(payloadBytes, &eventPayload)
	s.Require().Equal("personal:read", eventPayload["event"])
	s.Require().Equal(float64(sender.ID), eventPayload["userId"])

	// Check data array contains single read receipt
	dataRaw := eventPayload["data"].([]any)
	s.Require().Len(dataRaw, 1)
	readReceipt := dataRaw[0].(map[string]any)
	s.Require().Equal(float64(message.ID), readReceipt["messageId"])
}

func (s *StatusProcessorTestSuite) TestProcessRead_Multiple() {
	// Seed users and messages
	sender := s.SeedUser(1, "alice")
	receiver := s.SeedUser(2, "bob")

	chat := s.SeedChat(sender.ID, receiver.ID)
	_ = chat

	// Create multiple messages
	message1 := &domain.Message{
		SenderID: sender.ID,
		Content:  "Message 1",
	}
	result := s.DB.Create(message1)
	s.Require().NoError(result.Error)

	message2 := &domain.Message{
		SenderID: sender.ID,
		Content:  "Message 2",
	}
	result = s.DB.Create(message2)
	s.Require().NoError(result.Error)

	// Create recipients
	recipient1 := &domain.MessageRecipient{
		MessageID:  message1.ID,
		ReceiverID: receiver.ID,
		Status:     domain.MessageStatusDelivered,
	}
	s.DB.Create(recipient1)

	recipient2 := &domain.MessageRecipient{
		MessageID:  message2.ID,
		ReceiverID: receiver.ID,
		Status:     domain.MessageStatusDelivered,
	}
	s.DB.Create(recipient2)

	// Process read for both messages
	payloads := []broker.ReadPayload{
		{
			MessageId:  message1.ID,
			SenderId:   sender.ID,
			ReceiverId: receiver.ID,
		},
		{
			MessageId:  message2.ID,
			SenderId:   sender.ID,
			ReceiverId: receiver.ID,
		},
	}

	err := s.processor.ProcessRead(context.TODO(), payloads)
	s.Require().NoError(err)

	// Verify both updated to READ
	var recipients []domain.MessageRecipient
	result = s.DB.Find(&recipients)
	s.Require().NoError(result.Error)
	s.Require().Len(recipients, 2)

	for _, r := range recipients {
		s.Require().Equal(domain.MessageStatusRead, r.Status)
	}

	// Verify events published for both
	readMessages := s.GetPublishedByRoutingKey("1") // sender.ID (routing key)
	s.Require().Len(readMessages, 1, "Should publish single bulk event")

	var eventPayload map[string]any
	payloadBytes, _ := json.Marshal(readMessages[0].Message)
	json.Unmarshal(payloadBytes, &eventPayload)
	s.Require().Equal("personal:read", eventPayload["event"])
	s.Require().Equal(float64(sender.ID), eventPayload["userId"])

	// Check data array contains both read receipts
	dataRaw := eventPayload["data"].([]any)
	s.Require().Len(dataRaw, 2)
}

func (s *StatusProcessorTestSuite) TestProcessRead_EmptyList() {
	// Process empty list should not error
	err := s.processor.ProcessRead(context.TODO(), []broker.ReadPayload{})
	s.Require().NoError(err)

	// Verify no events published
	readMessages := s.GetPublishedByRoutingKey("personal.status-read")
	s.Require().Len(readMessages, 0)
}

func TestStatusProcessorTestSuite(t *testing.T) {
	suite.Run(t, new(StatusProcessorTestSuite))
}

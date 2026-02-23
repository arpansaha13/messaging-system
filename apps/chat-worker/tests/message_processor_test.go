package tests

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"testing"

	"github.com/stretchr/testify/suite"

	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/processor"
	"github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

type MessageProcessorTestSuite struct {
	BaseTestSuite
	processor *processor.MessageProcessor
}

func (s *MessageProcessorTestSuite) SetupTest() {
	s.BaseTestSuite.SetupTest()
	s.processor = processor.NewMessageProcessor(s.DB, s.Broker)
}

func (s *MessageProcessorTestSuite) TestProcessPersonalMessage_Success() {
	// Seed users
	sender := s.SeedUser(1, "alice")
	receiver := s.SeedUser(2, "bob")

	// Process personal message
	payload := &broker.PersonalMessagePayload{
		SenderId:   sender.ID,
		ReceiverId: receiver.ID,
		Content:    "Hello Bob!",
		Hash:       "hash123",
	}

	err := s.processor.ProcessPersonalMessage(context.TODO(), payload)
	s.Require().NoError(err)

	// Verify Chat rows created
	var chats []domain.Chat
	result := s.DB.Where("sender_id = ? AND receiver_id = ?", sender.ID, receiver.ID).Find(&chats)
	s.Require().NoError(result.Error)
	s.Require().Len(chats, 1, "Chat from sender to receiver should exist")

	result = s.DB.Where("sender_id = ? AND receiver_id = ?", receiver.ID, sender.ID).Find(&chats)
	s.Require().NoError(result.Error)
	s.Require().Len(chats, 1, "Chat from receiver to sender should exist")

	// Verify Message created
	var messages []domain.Message
	result = s.DB.Where("sender_id = ?", sender.ID).Find(&messages)
	s.Require().NoError(result.Error)
	s.Require().Len(messages, 1)
	s.Require().Equal("Hello Bob!", messages[0].Content)
	messageID := messages[0].ID

	// Verify MessageRecipient created with SENT status
	var recipients []domain.MessageRecipient
	result = s.DB.Where("message_id = ?", messageID).Find(&recipients)
	s.Require().NoError(result.Error)
	s.Require().Len(recipients, 1)
	s.Require().Equal(receiver.ID, recipients[0].ReceiverID)
	s.Require().Equal(domain.MessageStatusSent, recipients[0].Status)

	// Verify events published
	outgoingMessages := s.GetPublishedByTopic("outgoing")
	s.Require().GreaterOrEqual(len(outgoingMessages), 2, "Should publish status and receive events")

	// Verify personal:sent event to sender (routing key = sender ID)
	statusSentMessages := s.GetPublishedByRoutingKey(strconv.FormatInt(sender.ID, 10))
	s.Require().Len(statusSentMessages, 1)
	var statusSentPayload map[string]any
	payloadBytes, _ := json.Marshal(statusSentMessages[0].Message)
	json.Unmarshal(payloadBytes, &statusSentPayload)
	s.Require().Equal("personal:sent", statusSentPayload["event"])
	dataMap := statusSentPayload["data"].(map[string]any)
	s.Require().Equal(float64(messageID), dataMap["messageId"])
	s.Require().Equal(float64(receiver.ID), dataMap["receiverId"])

	// Verify personal:receive-message event to receiver (routing key = receiver ID)
	messageReceiveMessages := s.GetPublishedByRoutingKey(strconv.FormatInt(receiver.ID, 10))
	s.Require().Len(messageReceiveMessages, 1)
	var messageReceivePayload map[string]any
	payloadBytes, _ = json.Marshal(messageReceiveMessages[0].Message)
	json.Unmarshal(payloadBytes, &messageReceivePayload)
	s.Require().Equal("personal:receive-message", messageReceivePayload["event"])
	receiveDataMap := messageReceivePayload["data"].(map[string]any)
	s.Require().Equal(float64(messageID), receiveDataMap["messageId"])
	s.Require().Equal("Hello Bob!", receiveDataMap["content"])
}

func (s *MessageProcessorTestSuite) TestProcessPersonalMessage_SenderNotFound() {
	payload := &broker.PersonalMessagePayload{
		SenderId:   999,
		ReceiverId: 2,
		Content:    "Hello!",
		Hash:       "hash123",
	}

	err := s.processor.ProcessPersonalMessage(context.TODO(), payload)
	s.Require().Error(err)
}

func (s *MessageProcessorTestSuite) TestProcessPersonalMessage_ReceiverNotFound() {
	sender := s.SeedUser(1, "alice")

	payload := &broker.PersonalMessagePayload{
		SenderId:   sender.ID,
		ReceiverId: 999,
		Content:    "Hello!",
		Hash:       "hash123",
	}

	err := s.processor.ProcessPersonalMessage(context.TODO(), payload)
	s.Require().Error(err)
}

func (s *MessageProcessorTestSuite) TestProcessGroupMessage_Success() {
	// Seed group and members
	founder := s.SeedUser(1, "alice")
	member2 := s.SeedUser(2, "bob")
	member3 := s.SeedUser(3, "charlie")

	group := s.SeedGroup(1, "Test Group", founder.ID)
	s.SeedUserGroup(founder.ID, group.ID, "admin")
	s.SeedUserGroup(member2.ID, group.ID, "member")
	s.SeedUserGroup(member3.ID, group.ID, "member")

	channel := s.SeedChannel(1, "general", group.ID)

	// Process group message
	payload := &broker.GroupMessagePayload{
		SenderId:  founder.ID,
		GroupId:   group.ID,
		ChannelId: channel.ID,
		Content:   "Hello group!",
		Hash:      "hash123",
	}

	err := s.processor.ProcessGroupMessage(context.TODO(), payload)
	s.Require().NoError(err)

	// Verify Message created
	var messages []domain.Message
	result := s.DB.Where("channel_id = ?", channel.ID).Find(&messages)
	s.Require().NoError(result.Error)
	s.Require().Len(messages, 1)
	s.Require().Equal("Hello group!", messages[0].Content)
	messageID := messages[0].ID

	// Verify MessageRecipient created for each non-sender member
	var recipients []domain.MessageRecipient
	result = s.DB.Where("message_id = ?", messageID).Find(&recipients)
	s.Require().NoError(result.Error)
	s.Require().Len(recipients, 2, "Should have recipients for member2 and member3")

	// Verify status is SENT
	for _, recipient := range recipients {
		s.Require().Equal(domain.MessageStatusSent, recipient.Status)
		s.Require().Contains([]int64{member2.ID, member3.ID}, recipient.ReceiverID)
	}

	// Verify events published to each receiver using channel routing key
	channelRoutingKey := fmt.Sprintf("channel:%d", channel.ID)
	messageReceiveMessages := s.GetPublishedByRoutingKey(channelRoutingKey)
	s.Require().Len(messageReceiveMessages, 1, "Should publish a single message to channel binding")
	for _, msg := range messageReceiveMessages {
		var payload map[string]any
		payloadBytes, _ := json.Marshal(msg.Message)
		json.Unmarshal(payloadBytes, &payload)
		s.Require().Equal("group:receive-message", payload["event"])
	}
}

func (s *MessageProcessorTestSuite) TestProcessGroupMessage_SenderNotFound() {
	// Create founder user
	founder := s.SeedUser(1, "founder")
	group := s.SeedGroup(1, "Test Group", founder.ID)
	channel := s.SeedChannel(1, "general", group.ID)

	payload := &broker.GroupMessagePayload{
		SenderId:  999, // Non-existent sender
		GroupId:   group.ID,
		ChannelId: channel.ID,
		Content:   "Hello!",
		Hash:      "hash123",
	}

	err := s.processor.ProcessGroupMessage(context.TODO(), payload)
	s.Require().Error(err)
}

func (s *MessageProcessorTestSuite) TestProcessGroupMessage_ChannelNotFound() {
	sender := s.SeedUser(1, "alice")
	group := s.SeedGroup(1, "Test Group", sender.ID)
	s.SeedUserGroup(sender.ID, group.ID, "admin")

	payload := &broker.GroupMessagePayload{
		SenderId:  sender.ID,
		GroupId:   group.ID,
		ChannelId: 999,
		Content:   "Hello!",
		Hash:      "hash123",
	}

	err := s.processor.ProcessGroupMessage(context.TODO(), payload)
	s.Require().Error(err)
}

func (s *MessageProcessorTestSuite) TestProcessGroupMessage_NoOtherMembers() {
	// Create group with only founder
	founder := s.SeedUser(1, "alice")
	group := s.SeedGroup(1, "Test Group", founder.ID)
	s.SeedUserGroup(founder.ID, group.ID, "admin")
	channel := s.SeedChannel(1, "general", group.ID)

	payload := &broker.GroupMessagePayload{
		SenderId:  founder.ID,
		GroupId:   group.ID,
		ChannelId: channel.ID,
		Content:   "Hello!",
		Hash:      "hash123",
	}

	err := s.processor.ProcessGroupMessage(context.TODO(), payload)
	s.Require().NoError(err)

	// Message should still be created
	var messages []domain.Message
	result := s.DB.Where("channel_id = ?", channel.ID).Find(&messages)
	s.Require().NoError(result.Error)
	s.Require().Len(messages, 1)

	// But no recipients (only founder)
	var recipients []domain.MessageRecipient
	result = s.DB.Find(&recipients)
	s.Require().NoError(result.Error)
	s.Require().Len(recipients, 0)
}

func TestMessageProcessorTestSuite(t *testing.T) {
	suite.Run(t, new(MessageProcessorTestSuite))
}

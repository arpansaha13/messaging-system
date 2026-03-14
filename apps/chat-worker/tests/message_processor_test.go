package tests

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"testing"
	"time"

	"github.com/stretchr/testify/suite"

	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/processor"
	"github.com/arpansaha13/messaging-system/apps/common/broker"
)

type MessageProcessorTestSuite struct {
	BaseTestSuite
	processor *processor.MessageProcessor
}

func (s *MessageProcessorTestSuite) SetupTest() {
	s.BaseTestSuite.SetupTest()
	s.processor = processor.NewMessageProcessor(s.Broker)
}

func (s *MessageProcessorTestSuite) TestForwardPersonalMessage_PublishesReceiveEvent() {
	payload := &broker.ForwardPersonalMessagePayload{
		MessageId:  42,
		SenderId:   1,
		ReceiverId: 2,
		Content:    "Hello Bob!",
		CreatedAt:  time.Now(),
	}

	err := s.processor.ForwardPersonalMessage(context.TODO(), payload)
	s.Require().NoError(err)

	// Should publish exactly one event to the receiver's routing key
	outgoingMessages := s.GetPublishedByTopic("outgoing")
	s.Require().Len(outgoingMessages, 1, "Should publish exactly one event")

	msgs := s.GetPublishedByRoutingKey(strconv.FormatInt(payload.ReceiverId, 10))
	s.Require().Len(msgs, 1)

	var published map[string]any
	payloadBytes, _ := json.Marshal(msgs[0].Message)
	json.Unmarshal(payloadBytes, &published)
	s.Require().Equal("personal:receive-message", published["event"])

	data := published["data"].(map[string]any)
	s.Require().Equal(float64(42), data["messageId"])
	s.Require().Equal("Hello Bob!", data["content"])
	s.Require().Equal(float64(1), data["senderId"])
}

func (s *MessageProcessorTestSuite) TestForwardGroupMessage_PublishesSentAndReceiveEvents() {
	channelID := int64(10)
	payload := &broker.ForwardGroupMessagePayload{
		MessageId: 99,
		SenderId:  1,
		GroupId:   5,
		ChannelId: channelID,
		Content:   "Hello group!",
		Hash:      "hash123",
		CreatedAt: time.Now(),
	}

	err := s.processor.ForwardGroupMessage(context.TODO(), payload)
	s.Require().NoError(err)

	// Should publish two events: group:sent to sender, group:receive-message to channel
	outgoingMessages := s.GetPublishedByTopic("outgoing")
	s.Require().Len(outgoingMessages, 2, "Should publish group:sent and group:receive-message")

	// Verify group:sent to sender
	senderMsgs := s.GetPublishedByRoutingKey(strconv.FormatInt(payload.SenderId, 10))
	s.Require().Len(senderMsgs, 1)
	var sentPayload map[string]any
	payloadBytes, _ := json.Marshal(senderMsgs[0].Message)
	json.Unmarshal(payloadBytes, &sentPayload)
	s.Require().Equal("group:sent", sentPayload["event"])
	sentData := sentPayload["data"].(map[string]any)
	s.Require().Equal(float64(99), sentData["messageId"])
	s.Require().Equal("hash123", sentData["hash"])

	// Verify group:receive-message to channel routing key
	channelRoutingKey := fmt.Sprintf("channel:%d", channelID)
	channelMsgs := s.GetPublishedByRoutingKey(channelRoutingKey)
	s.Require().Len(channelMsgs, 1)
	var receivePayload map[string]any
	payloadBytes, _ = json.Marshal(channelMsgs[0].Message)
	json.Unmarshal(payloadBytes, &receivePayload)
	s.Require().Equal("group:receive-message", receivePayload["event"])
	receiveData := receivePayload["data"].(map[string]any)
	s.Require().Equal(float64(99), receiveData["messageId"])
	s.Require().Equal("Hello group!", receiveData["content"])
}

func TestMessageProcessorTestSuite(t *testing.T) {
	suite.Run(t, new(MessageProcessorTestSuite))
}

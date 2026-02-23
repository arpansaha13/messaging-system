package tests

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/suite"

	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/processor"
	"github.com/arpansaha13/messaging-system/apps/common/broker"
)

type ConnectionProcessorTestSuite struct {
	BaseTestSuite
	processor *processor.ConnectionProcessor
}

func (s *ConnectionProcessorTestSuite) SetupTest() {
	s.BaseTestSuite.SetupTest()
	s.processor = processor.NewConnectionProcessor(s.DB, s.Broker)
}

func (s *ConnectionProcessorTestSuite) TestProcessUserConnection_WithGroups() {
	// Seed user with groups and channels
	user := s.SeedUser(1, "alice")
	group1 := s.SeedGroup(1, "Group 1", user.ID)
	group2 := s.SeedGroup(2, "Group 2", user.ID)

	s.SeedUserGroup(user.ID, group1.ID, "admin")
	s.SeedUserGroup(user.ID, group2.ID, "member")

	channel1 := s.SeedChannel(1, "general", group1.ID)
	channel2 := s.SeedChannel(2, "random", group1.ID)
	channel3 := s.SeedChannel(3, "announcements", group2.ID)

	// Process user connection
	payload := &broker.UserConnectionPayload{
		UserId:   user.ID,
		ServerId: "server-1",
	}

	err := s.processor.ProcessUserConnection(context.TODO(), payload)
	s.Require().NoError(err)

	// Verify subscription event published to server routing key
	subscriptionMessages := s.GetPublishedByRoutingKey("server-1")
	s.Require().Len(subscriptionMessages, 1)
	s.Require().Equal("subscription", subscriptionMessages[0].Topic)

	// Verify payload structure
	var eventPayload map[string]any
	payloadBytes, _ := json.Marshal(subscriptionMessages[0].Message)
	json.Unmarshal(payloadBytes, &eventPayload)

	s.Require().Equal(float64(user.ID), eventPayload["userId"])

	// Check groupIds array
	groupIdsRaw := eventPayload["groupIds"].([]any)
	groupIds := make([]int64, len(groupIdsRaw))
	for i, id := range groupIdsRaw {
		groupIds[i] = int64(id.(float64))
	}
	s.Require().ElementsMatch([]int64{group1.ID, group2.ID}, groupIds)

	// Check channelIds array
	channelIdsRaw := eventPayload["channelIds"].([]any)
	channelIds := make([]int64, len(channelIdsRaw))
	for i, id := range channelIdsRaw {
		channelIds[i] = int64(id.(float64))
	}
	s.Require().ElementsMatch([]int64{channel1.ID, channel2.ID, channel3.ID}, channelIds)
}

func (s *ConnectionProcessorTestSuite) TestProcessUserConnection_NoGroups() {
	// Seed user with no groups
	user := s.SeedUser(1, "alice")

	// Process user connection
	payload := &broker.UserConnectionPayload{
		UserId:   user.ID,
		ServerId: "server-1",
	}

	err := s.processor.ProcessUserConnection(context.TODO(), payload)
	s.Require().NoError(err)

	// Verify subscription event published with empty arrays
	subscriptionMessages := s.GetPublishedByRoutingKey("server-1")
	s.Require().Len(subscriptionMessages, 1)

	var eventPayload map[string]any
	payloadBytes, _ := json.Marshal(subscriptionMessages[0].Message)
	json.Unmarshal(payloadBytes, &eventPayload)

	s.Require().Equal(float64(user.ID), eventPayload["userId"])

	// Check empty arrays
	groupIds := eventPayload["groupIds"].([]any)
	s.Require().Len(groupIds, 0)

	channelIds := eventPayload["channelIds"].([]any)
	s.Require().Len(channelIds, 0)
}

func (s *ConnectionProcessorTestSuite) TestProcessUserConnection_MultipleGroups() {
	// Create complex scenario
	user := s.SeedUser(1, "alice")
	otherUser := s.SeedUser(2, "bob")

	group1 := s.SeedGroup(1, "Group 1", otherUser.ID)
	group2 := s.SeedGroup(2, "Group 2", otherUser.ID)
	group3 := s.SeedGroup(3, "Group 3", otherUser.ID)

	s.SeedUserGroup(user.ID, group1.ID, "member")
	s.SeedUserGroup(user.ID, group2.ID, "member")
	s.SeedUserGroup(user.ID, group3.ID, "admin")
	// otherUser is not in any group

	// Create multiple channels per group
	channel1 := s.SeedChannel(1, "general", group1.ID)
	channel2 := s.SeedChannel(2, "random", group1.ID)
	channel3 := s.SeedChannel(3, "announcements", group2.ID)
	channel4 := s.SeedChannel(4, "tech-talk", group3.ID)

	// Process connection
	payload := &broker.UserConnectionPayload{
		UserId:   user.ID,
		ServerId: "server-42",
	}

	err := s.processor.ProcessUserConnection(context.TODO(), payload)
	s.Require().NoError(err)

	// Verify event
	subscriptionMessages := s.GetPublishedByRoutingKey("server-42")
	s.Require().Len(subscriptionMessages, 1)

	var eventPayload map[string]any
	payloadBytes, _ := json.Marshal(subscriptionMessages[0].Message)
	json.Unmarshal(payloadBytes, &eventPayload)

	s.Require().Equal(float64(user.ID), eventPayload["userId"])

	// Verify all groups
	groupIdsRaw := eventPayload["groupIds"].([]any)
	groupIds := make([]int64, len(groupIdsRaw))
	for i, id := range groupIdsRaw {
		groupIds[i] = int64(id.(float64))
	}
	s.Require().ElementsMatch([]int64{group1.ID, group2.ID, group3.ID}, groupIds)

	// Verify all channels
	channelIdsRaw := eventPayload["channelIds"].([]any)
	channelIds := make([]int64, len(channelIdsRaw))
	for i, id := range channelIdsRaw {
		channelIds[i] = int64(id.(float64))
	}
	s.Require().ElementsMatch([]int64{channel1.ID, channel2.ID, channel3.ID, channel4.ID}, channelIds)
}

func (s *ConnectionProcessorTestSuite) TestProcessUserConnection_DifferentServers() {
	// Seed user with groups
	user := s.SeedUser(1, "alice")
	group := s.SeedGroup(1, "Group 1", user.ID)
	s.SeedUserGroup(user.ID, group.ID, "member")
	channel := s.SeedChannel(1, "general", group.ID)
	_ = channel

	// Process connections from different servers
	payload1 := &broker.UserConnectionPayload{
		UserId:   user.ID,
		ServerId: "server-1",
	}
	payload2 := &broker.UserConnectionPayload{
		UserId:   user.ID,
		ServerId: "server-2",
	}

	err := s.processor.ProcessUserConnection(context.TODO(), payload1)
	s.Require().NoError(err)

	err = s.processor.ProcessUserConnection(context.TODO(), payload2)
	s.Require().NoError(err)

	// Verify events published to both servers
	messages1 := s.GetPublishedByRoutingKey("server-1")
	s.Require().Len(messages1, 1)

	messages2 := s.GetPublishedByRoutingKey("server-2")
	s.Require().Len(messages2, 1)
}

func TestConnectionProcessorTestSuite(t *testing.T) {
	suite.Run(t, new(ConnectionProcessorTestSuite))
}

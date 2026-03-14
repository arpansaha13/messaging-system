package broker

import (
	"context"
	"encoding/json"
)

// ServerQueueMessage is the envelope published to the outgoing exchange
// by the backend or chat-worker for delivery to connected clients.
type ServerQueueMessage struct {
	Event     string          `json:"event"`
	UserId    *int64          `json:"userId,omitempty"`    // route to a single user's socket
	ChannelId *int64          `json:"channelId,omitempty"` // route to a channel room
	GroupId   *int64          `json:"groupId,omitempty"`   // route to a group room
	Data      json.RawMessage `json:"data"`
}

// SubscriptionMessage is published to the subscription exchange by the backend
// when a user connects, containing their channel and group memberships.
type SubscriptionMessage struct {
	UserId     int64   `json:"userId"`
	GroupIds   []int64 `json:"groupIds"`
	ChannelIds []int64 `json:"channelIds"`
}

// UserConnectionPayload is published to the incoming exchange on user connect.
type UserConnectionPayload struct {
	UserId   int64  `json:"userId"`
	ServerId string `json:"serverId"`
}

// SocketBroker defines the interface for the socket server's message broker.
// It manages per-server exclusive queues with dynamic AMQP routing key binding.
type SocketBroker interface {
	Connect(ctx context.Context) error
	Disconnect() error

	// Dynamic queue binding — called on connect/disconnect and subscription
	BindUserToQueue(userId int64) error
	UnbindUserFromQueue(userId int64) error
	BindChannelToQueue(channelId int64) error
	UnbindChannelFromQueue(channelId int64) error
	BindGroupToQueue(groupId int64) error
	UnbindGroupFromQueue(groupId int64) error

	// Publishing
	PublishToIncoming(routingKey string, message any) error // → incoming_messages exchange
	PublishToOutgoing(routingKey string, message any) error // → outgoing_messages exchange (e.g. typing)

	// Consuming
	ConsumeFromServerQueue(onMessage func(msg *ServerQueueMessage, ack func())) error
	ConsumeFromSubscriptionQueue(onMessage func(msg *SubscriptionMessage, ack func())) error

	GetServerId() string
}

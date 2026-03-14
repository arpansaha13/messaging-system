package broker

import (
	"context"
	"time"

	"github.com/arpansaha13/gotoolkit"
)

// MessagePayload represents the base structure for messages in RabbitMQ
type MessagePayload struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

// PersonalMessagePayload for personal message sends
type PersonalMessagePayload struct {
	SenderId   int64  `json:"senderId"`
	ReceiverId int64  `json:"receiverId"`
	Content    string `json:"content"`
	Hash       string `json:"hash"`
}

// GroupMessagePayload for group message sends
type GroupMessagePayload struct {
	SenderId  int64  `json:"senderId"`
	GroupId   int64  `json:"groupId"`
	ChannelId int64  `json:"channelId"`
	Content   string `json:"content"`
	Hash      string `json:"hash"`
}

// DeliveredPayload for message delivered status
type DeliveredPayload struct {
	MessageId  int64 `json:"messageId"`
	ReceiverId int64 `json:"receiverId"`
	SenderId   int64 `json:"senderId"`
}

// ReadPayload for message read status
type ReadPayload struct {
	MessageId  int64 `json:"messageId"`
	SenderId   int64 `json:"senderId"`
	ReceiverId int64 `json:"receiverId"`
}

// ForwardPersonalMessagePayload carries a pre-persisted personal message to forward to the recipient
type ForwardPersonalMessagePayload struct {
	MessageId  int64     `json:"messageId"`
	SenderId   int64     `json:"senderId"`
	ReceiverId int64     `json:"receiverId"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"createdAt"`
}

// ForwardGroupMessagePayload carries a pre-persisted group message to forward to the channel
type ForwardGroupMessagePayload struct {
	MessageId int64     `json:"messageId"`
	SenderId  int64     `json:"senderId"`
	GroupId   int64     `json:"groupId"`
	ChannelId int64     `json:"channelId"`
	Content   string    `json:"content"`
	Hash      string    `json:"hash"`
	CreatedAt time.Time `json:"createdAt"`
}

// UserConnectionPayload for user connection events
type UserConnectionPayload struct {
	UserId   int64  `json:"userId"`
	ServerId string `json:"serverId"`
}

// MessageBroker defines the interface for message broking
type MessageBroker interface {
	// Message consumption
	ConsumeWorkerQueue(onMessage func(msg *MessagePayload, ack func()) error) error
	ConsumeConnectionQueue(onMessage func(msg *UserConnectionPayload, ack func()) error) error

	// Message publishing
	PublishToOutgoing(routingKey string, message any) error
	PublishToSubscription(serverId string, message any) error

	// Lifecycle
	Connect(ctx context.Context, opts ...gotoolkit.BackoffOption) error
	Disconnect() error
	IsConnected() bool
}

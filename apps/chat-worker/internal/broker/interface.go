package broker

import (
	"context"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	commonbr "github.com/arpansaha13/messaging-system/apps/common/broker"
)

// ChatBroker defines the interface for the chat-worker's message broker.
type ChatBroker interface {
	Connect(ctx context.Context, opts ...gtk.BackoffOption) error
	Disconnect() error

	// Lifecycle events
	SetDisconnectHandler(handler func(err error))

	// Consuming
	ConsumeWorkerQueue(onMessage func(msg *commonbr.MessagePayload, ack func()) error) error
	ConsumeConnectionQueue(onMessage func(msg *commonbr.UserConnectionPayload, ack func()) error) error

	// Publishing
	PublishToOutgoing(routingKey string, message any) error
	PublishToSubscription(serverId string, message any) error
}

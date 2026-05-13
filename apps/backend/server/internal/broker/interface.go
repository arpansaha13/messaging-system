package broker

import "context"

type ChatBroker interface {
	Connect(ctx context.Context) error
	Disconnect() error
	IsConnected() bool
	SetDisconnectHandler(handler func(err error))
	PublishToIncoming(routingKey string, message any) error

	PublishToOutgoing(routingKey string, message any) error
}

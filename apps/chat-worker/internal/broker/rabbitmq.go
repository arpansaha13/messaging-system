package broker

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/sony/gobreaker/v2"
	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
)

const (
	incomingExchange     = "incoming_messages"
	outgoingExchange     = "outgoing_messages"
	subscriptionExchange = "subscription_data"
	workerQueue          = "chat-worker-queue"
	connectionQueue      = "connection-events-queue"
)

// RabbitMQBroker implements the broker.MessageBroker interface using RabbitMQ
type RabbitMQBroker struct {
	amqpURL string
	conn    *amqp091.Connection
	channel *amqp091.Channel
	cb      *gobreaker.CircuitBreaker[any]
}

// NewRabbitMQBroker creates a new RabbitMQ broker instance
func NewRabbitMQBroker(amqpURL string, cb *gobreaker.CircuitBreaker[any]) *RabbitMQBroker {
	return &RabbitMQBroker{amqpURL: amqpURL, cb: cb}
}

// Connect establishes connection to RabbitMQ and sets up exchanges and queues
func (rb *RabbitMQBroker) Connect(ctx context.Context, opts ...gotoolkit.BackoffOption) error {
	conn, err := gotoolkit.ConnectRabbitMQWithBackoff(ctx, rb.amqpURL, opts...)
	if err != nil {
		return fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return fmt.Errorf("failed to open channel: %w", err)
	}

	rb.conn = conn
	rb.channel = channel

	if err := rb.declareExchangesAndQueues(); err != nil {
		channel.Close()
		conn.Close()
		return err
	}

	zap.L().Info("connected to RabbitMQ")
	return nil
}

// declareExchangesAndQueues sets up all exchanges and queue bindings
func (rb *RabbitMQBroker) declareExchangesAndQueues() error {
	// Declare exchanges
	if err := rb.channel.ExchangeDeclare(incomingExchange, "direct", true, false, false, false, nil); err != nil {
		return fmt.Errorf("failed to declare incoming exchange: %w", err)
	}

	if err := rb.channel.ExchangeDeclare(outgoingExchange, "direct", true, false, false, false, nil); err != nil {
		return fmt.Errorf("failed to declare outgoing exchange: %w", err)
	}

	if err := rb.channel.ExchangeDeclare(subscriptionExchange, "direct", true, false, false, false, nil); err != nil {
		return fmt.Errorf("failed to declare subscription exchange: %w", err)
	}

	// Declare worker queue
	if _, err := rb.channel.QueueDeclare(workerQueue, true, false, false, false, nil); err != nil {
		return fmt.Errorf("failed to declare worker queue: %w", err)
	}

	// Declare connection queue
	if _, err := rb.channel.QueueDeclare(connectionQueue, true, false, false, false, nil); err != nil {
		return fmt.Errorf("failed to declare connection queue: %w", err)
	}

	// Bind worker queue to routing keys
	routingKeys := []string{"personal.message", "personal.delivered", "personal.read", "group.message"}
	for _, key := range routingKeys {
		if err := rb.channel.QueueBind(workerQueue, key, incomingExchange, false, nil); err != nil {
			return fmt.Errorf("failed to bind queue %s: %w", key, err)
		}
	}

	// Bind connection queue
	if err := rb.channel.QueueBind(connectionQueue, "connection.user", incomingExchange, false, nil); err != nil {
		return fmt.Errorf("failed to bind connection queue: %w", err)
	}

	return nil
}

// ConsumeWorkerQueue consumes messages from the worker queue
func (rb *RabbitMQBroker) ConsumeWorkerQueue(onMessage func(msg *broker.MessagePayload, ack func()) error) error {
	if !rb.IsConnected() {
		return fmt.Errorf("RabbitMQ not connected")
	}

	deliveries, err := rb.channel.Consume(workerQueue, "", false, false, false, false, nil)
	if err != nil {
		return fmt.Errorf("failed to consume from worker queue: %w", err)
	}

	go func() {
		for delivery := range deliveries {
			var msg broker.MessagePayload
			if err := json.Unmarshal(delivery.Body, &msg); err != nil {
				zap.L().Error("failed to unmarshal message", zap.Error(err))
				rb.channel.Ack(delivery.DeliveryTag, false)
				continue
			}

			ackFn := func() { rb.channel.Ack(delivery.DeliveryTag, false) }
			if err := onMessage(&msg, ackFn); err != nil {
				zap.L().Error("error processing message", zap.Error(err))
			}
		}
	}()

	return nil
}

// ConsumeConnectionQueue consumes messages from the connection queue
func (rb *RabbitMQBroker) ConsumeConnectionQueue(onMessage func(msg *broker.UserConnectionPayload, ack func()) error) error {
	if !rb.IsConnected() {
		return fmt.Errorf("RabbitMQ not connected")
	}

	deliveries, err := rb.channel.Consume(connectionQueue, "", false, false, false, false, nil)
	if err != nil {
		return fmt.Errorf("failed to consume from connection queue: %w", err)
	}

	go func() {
		for delivery := range deliveries {
			var msg broker.UserConnectionPayload
			if err := json.Unmarshal(delivery.Body, &msg); err != nil {
				zap.L().Error("failed to unmarshal connection message", zap.Error(err))
				rb.channel.Ack(delivery.DeliveryTag, false)
				continue
			}

			ackFn := func() { rb.channel.Ack(delivery.DeliveryTag, false) }
			if err := onMessage(&msg, ackFn); err != nil {
				zap.L().Error("error processing connection message", zap.Error(err))
			}
		}
	}()

	return nil
}

// PublishToOutgoing publishes a message to the outgoing exchange
func (rb *RabbitMQBroker) PublishToOutgoing(routingKey string, message any) error {
	if !rb.IsConnected() {
		return fmt.Errorf("RabbitMQ not connected")
	}

	_, err := rb.cb.Execute(func() (any, error) {
		body, err := json.Marshal(message)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal message: %w", err)
		}

		err = rb.channel.Publish(outgoingExchange, routingKey, false, false, amqp091.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp091.Persistent,
		})

		if err != nil {
			return nil, fmt.Errorf("failed to publish message: %w", err)
		}

		return nil, nil
	})

	if err != nil {
		return err
	}

	return nil
}

// PublishToSubscription publishes a message to the subscription exchange
func (rb *RabbitMQBroker) PublishToSubscription(serverId string, message any) error {
	if !rb.IsConnected() {
		return fmt.Errorf("RabbitMQ not connected")
	}

	_, err := rb.cb.Execute(func() (any, error) {
		body, err := json.Marshal(message)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal message: %w", err)
		}

		err = rb.channel.Publish(subscriptionExchange, serverId, false, false, amqp091.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp091.Persistent,
		})

		if err != nil {
			return nil, fmt.Errorf("failed to publish subscription message: %w", err)
		}

		return nil, nil
	})

	if err != nil {
		return err
	}

	return nil
}

// Disconnect closes the RabbitMQ connection
func (rb *RabbitMQBroker) Disconnect() error {
	if rb.channel != nil {
		if err := rb.channel.Close(); err != nil {
			zap.L().Error("error closing channel", zap.Error(err))
		}
	}

	if rb.conn != nil {
		if err := rb.conn.Close(); err != nil {
			return fmt.Errorf("error closing connection: %w", err)
		}
	}

	zap.L().Info("disconnected from RabbitMQ")
	return nil
}

// IsConnected checks if the broker is connected
func (rb *RabbitMQBroker) IsConnected() bool {
	return rb.conn != nil && rb.channel != nil && !rb.conn.IsClosed()
}

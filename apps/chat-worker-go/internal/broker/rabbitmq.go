package broker

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/rabbitmq/amqp091-go"
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
	conn    *amqp091.Connection
	channel *amqp091.Channel
}

// NewRabbitMQBroker creates a new RabbitMQ broker instance
func NewRabbitMQBroker() *RabbitMQBroker {
	return &RabbitMQBroker{}
}

// Connect establishes connection to RabbitMQ and sets up exchanges and queues
func (rb *RabbitMQBroker) Connect() error {
	hostname := os.Getenv("RABBITMQ_HOST")
	if hostname == "" {
		hostname = "localhost"
	}

	port := os.Getenv("RABBITMQ_PORT")
	if port == "" {
		port = "5672"
	}

	username := os.Getenv("RABBITMQ_USER")
	if username == "" {
		username = "guest"
	}

	password := os.Getenv("RABBITMQ_PASS")
	if password == "" {
		password = "guest"
	}

	url := fmt.Sprintf("amqp://%s:%s@%s:%s/", username, password, hostname, port)

	conn, err := amqp091.Dial(url)
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

	log.Println("RabbitMQ connected. Worker ready.")
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
				log.Printf("failed to unmarshal message: %v", err)
				rb.channel.Ack(delivery.DeliveryTag, false)
				continue
			}

			ackFn := func() { rb.channel.Ack(delivery.DeliveryTag, false) }
			if err := onMessage(&msg, ackFn); err != nil {
				log.Printf("error processing message: %v", err)
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
				log.Printf("failed to unmarshal connection message: %v", err)
				rb.channel.Ack(delivery.DeliveryTag, false)
				continue
			}

			ackFn := func() { rb.channel.Ack(delivery.DeliveryTag, false) }
			if err := onMessage(&msg, ackFn); err != nil {
				log.Printf("error processing connection message: %v", err)
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

	body, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	err = rb.channel.Publish(outgoingExchange, routingKey, false, false, amqp091.Publishing{
		ContentType:  "application/json",
		Body:         body,
		DeliveryMode: amqp091.Persistent,
	})

	if err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	return nil
}

// PublishToSubscription publishes a message to the subscription exchange
func (rb *RabbitMQBroker) PublishToSubscription(serverId string, message any) error {
	if !rb.IsConnected() {
		return fmt.Errorf("RabbitMQ not connected")
	}

	body, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	err = rb.channel.Publish(subscriptionExchange, serverId, false, false, amqp091.Publishing{
		ContentType:  "application/json",
		Body:         body,
		DeliveryMode: amqp091.Persistent,
	})

	if err != nil {
		return fmt.Errorf("failed to publish subscription message: %w", err)
	}

	return nil
}

// Disconnect closes the RabbitMQ connection
func (rb *RabbitMQBroker) Disconnect() error {
	if rb.channel != nil {
		if err := rb.channel.Close(); err != nil {
			log.Printf("error closing channel: %v", err)
		}
	}

	if rb.conn != nil {
		if err := rb.conn.Close(); err != nil {
			return fmt.Errorf("error closing connection: %w", err)
		}
	}

	log.Println("RabbitMQ disconnected")
	return nil
}

// IsConnected checks if the broker is connected
func (rb *RabbitMQBroker) IsConnected() bool {
	return rb.conn != nil && rb.channel != nil && !rb.conn.IsClosed()
}

package service

import (
	"encoding/json"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
)

const (
	IncomingExchange = "incoming_messages"
	OutgoingExchange = "outgoing_messages"
)

// RabbitMQMessage represents a message structure for RabbitMQ publishing
type RabbitMQMessage struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

// PersonalMessagePayload represents personal message payload
type PersonalMessagePayload struct {
	SenderID   int64  `json:"senderId"`
	ReceiverID int64  `json:"receiverId"`
	Content    string `json:"content"`
	Hash       string `json:"hash"`
}

// GroupMessagePayload represents group message payload
type GroupMessagePayload struct {
	SenderID  int64  `json:"senderId"`
	GroupID   int64  `json:"groupId"`
	ChannelID int64  `json:"channelId"`
	Content   string `json:"content"`
	Hash      string `json:"hash"`
}

// DeliveredPayload represents message delivered status payload
type DeliveredPayload struct {
	MessageID  int64 `json:"messageId"`
	ReceiverID int64 `json:"receiverId"`
	SenderID   int64 `json:"senderId"`
}

// ReadPayload represents message read status payload
type ReadPayload struct {
	MessageID  int64 `json:"messageId"`
	SenderID   int64 `json:"senderId"`
	ReceiverID int64 `json:"receiverId"`
}

// RabbitMQService handles RabbitMQ connection and messaging
type RabbitMQService struct {
	conn    *amqp.Connection
	channel *amqp.Channel
}

// NewRabbitMQService creates a new RabbitMQ service
func NewRabbitMQService(url string) (*RabbitMQService, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}

	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, err
	}

	service := &RabbitMQService{
		conn:    conn,
		channel: channel,
	}

	// Declare exchanges
	if err := service.declareExchanges(); err != nil {
		channel.Close()
		conn.Close()
		return nil, err
	}

	log.Println("RabbitMQ connected from backend")
	return service, nil
}

// declareExchanges declares the required exchanges
func (r *RabbitMQService) declareExchanges() error {
	if err := r.channel.ExchangeDeclare(
		IncomingExchange, // name
		"direct",         // type
		true,             // durable
		false,            // autoDelete
		false,            // internal
		false,            // noWait
		nil,              // arguments
	); err != nil {
		return err
	}

	if err := r.channel.ExchangeDeclare(
		OutgoingExchange, // name
		"direct",         // type
		true,             // durable
		false,            // autoDelete
		false,            // internal
		false,            // noWait
		nil,              // arguments
	); err != nil {
		return err
	}

	return nil
}

// PublishToIncoming publishes a message to the incoming exchange
func (r *RabbitMQService) PublishToIncoming(routingKey string, message any) error {
	if r.channel == nil {
		return &domain.InternalError{Message: "RabbitMQ channel not initialized"}
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("failed to marshal message: %v", err)
		return err
	}

	err = r.channel.Publish(
		IncomingExchange, // exchange
		routingKey,       // routing key
		false,            // mandatory
		false,            // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         messageBytes,
			DeliveryMode: amqp.Persistent,
		},
	)

	if err != nil {
		log.Printf("failed to publish message: %v", err)
		return err
	}

	return nil
}

// PublishToOutgoing publishes a message to the outgoing exchange
func (r *RabbitMQService) PublishToOutgoing(routingKey string, message any) error {
	if r.channel == nil {
		return &domain.InternalError{Message: "RabbitMQ channel not initialized"}
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("failed to marshal message: %v", err)
		return err
	}

	err = r.channel.Publish(
		OutgoingExchange, // exchange
		routingKey,       // routing key
		false,            // mandatory
		false,            // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         messageBytes,
			DeliveryMode: amqp.Persistent,
		},
	)

	if err != nil {
		log.Printf("failed to publish message: %v", err)
		return err
	}

	return nil
}

// Close closes the RabbitMQ connection
func (r *RabbitMQService) Close() error {
	if r.channel != nil {
		if err := r.channel.Close(); err != nil {
			log.Printf("error closing channel: %v", err)
		}
	}

	if r.conn != nil {
		if err := r.conn.Close(); err != nil {
			log.Printf("error closing connection: %v", err)
			return err
		}
	}

	log.Println("RabbitMQ disconnected from backend")
	return nil
}

// IsConnected checks if RabbitMQ is connected
func (r *RabbitMQService) IsConnected() bool {
	if r == nil {
		return false
	}
	return r.conn != nil && r.channel != nil && !r.conn.IsClosed()
}

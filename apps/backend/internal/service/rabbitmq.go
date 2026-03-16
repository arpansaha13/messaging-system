package service

import (
	"encoding/json"

	"github.com/arpansaha13/gotoolkit"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
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

// MarkReadInput is the service-layer input for marking messages as read.
// Kept separate from ReadPayload (the RabbitMQ wire format) so broker details
// are not exposed to callers.
type MarkReadInput struct {
	MessageID  int64
	ReceiverID int64
}

// RabbitMQService handles RabbitMQ connection and messaging
type RabbitMQService struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	logger  *zap.Logger
	cb      *gobreaker.CircuitBreaker[any]
}

// NewRabbitMQService creates a new RabbitMQ service with injected logger and circuit breaker
func NewRabbitMQService(logger *zap.Logger, cb *gobreaker.CircuitBreaker[any]) *RabbitMQService {
	return &RabbitMQService{
		conn:    nil,
		channel: nil,
		logger:  logger,
		cb:      cb,
	}
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
		r.logger.Error("failed to declare incoming exchange", zap.String("exchange", IncomingExchange), zap.Error(err))
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
		r.logger.Error("failed to declare outgoing exchange", zap.String("exchange", OutgoingExchange), zap.Error(err))
		return err
	}

	return nil
}

// SetConnection sets the connection and performs initial setup (exchange declaration)
func (r *RabbitMQService) SetConnection(conn *amqp.Connection) error {
	r.conn = conn

	// Create channel from the connection
	ch, err := conn.Channel()
	if err != nil {
		r.logger.Error("failed to open RabbitMQ channel", zap.Error(err))
		return err
	}

	r.channel = ch

	// Declare exchanges
	if err := r.declareExchanges(); err != nil {
		r.logger.Error("failed to declare exchanges", zap.Error(err))
		return err
	}

	return nil
}

// UnsetConnection clears the connection and channel
func (r *RabbitMQService) UnsetConnection() {
	r.conn = nil
	r.channel = nil
}

// PublishToIncoming publishes a message to the incoming exchange
func (r *RabbitMQService) PublishToIncoming(routingKey string, message any) error {
	_, err := r.cb.Execute(func() (any, error) {
		if r.channel == nil {
			return nil, &gotoolkit.InternalError{Message: "RabbitMQ channel not initialized"}
		}

		messageBytes, err := json.Marshal(message)
		if err != nil {
			r.logger.Error("failed to marshal message for incoming publish", zap.String("routing_key", routingKey), zap.Error(err))
			return nil, err
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
			r.logger.Error("failed to publish message to incoming exchange", zap.String("routing_key", routingKey), zap.Error(err))
			return nil, err
		}

		return nil, nil
	})

	return err
}

// PublishToOutgoing publishes a message to the outgoing exchange
func (r *RabbitMQService) PublishToOutgoing(routingKey string, message any) error {
	_, err := r.cb.Execute(func() (any, error) {
		if r.channel == nil {
			return nil, &gotoolkit.InternalError{Message: "RabbitMQ channel not initialized"}
		}

		messageBytes, err := json.Marshal(message)
		if err != nil {
			r.logger.Error("failed to marshal message for outgoing publish", zap.String("routing_key", routingKey), zap.Error(err))
			return nil, err
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
			r.logger.Error("failed to publish message to outgoing exchange", zap.String("routing_key", routingKey), zap.Error(err))
			return nil, err
		}

		return nil, nil
	})

	return err
}

// Close closes the RabbitMQ connection
func (r *RabbitMQService) Close() error {
	if r.channel != nil {
		if err := r.channel.Close(); err != nil {
			r.logger.Error("error closing rabbitmq channel", zap.Error(err))
		}
	}

	if r.conn != nil {
		if err := r.conn.Close(); err != nil {
			r.logger.Error("error closing rabbitmq connection", zap.Error(err))
			return err
		}
	}

	r.logger.Info("RabbitMQ disconnected from backend")
	return nil
}

// IsConnected checks if RabbitMQ is connected
func (r *RabbitMQService) IsConnected() bool {
	if r == nil {
		return false
	}
	return r.conn != nil && r.channel != nil && !r.conn.IsClosed()
}

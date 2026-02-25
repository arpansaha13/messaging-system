package service

import (
	"encoding/json"

	"github.com/arpansaha13/gotoolkit"
	amqp "github.com/rabbitmq/amqp091-go"
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

// RabbitMQService handles RabbitMQ connection and messaging
type RabbitMQService struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	logger  *zap.Logger
}

// NewRabbitMQService creates a new RabbitMQ service
func NewRabbitMQService(url string) (*RabbitMQService, error) {
	logger, err := zap.NewProduction()
	if err != nil {
		return nil, err
	}

	conn, err := amqp.Dial(url)
	if err != nil {
		logger.Error("failed to connect to rabbitmq", zap.String("url", url), zap.Error(err))
		return nil, err
	}

	channel, err := conn.Channel()
	if err != nil {
		logger.Error("failed to create rabbitmq channel", zap.Error(err))
		conn.Close()
		return nil, err
	}

	service := &RabbitMQService{
		conn:    conn,
		channel: channel,
		logger:  logger,
	}

	// Declare exchanges
	if err := service.declareExchanges(); err != nil {
		logger.Error("failed to declare exchanges", zap.Error(err))
		channel.Close()
		conn.Close()
		return nil, err
	}

	logger.Info("RabbitMQ connected from backend", zap.String("url", url))
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

// PublishToIncoming publishes a message to the incoming exchange
func (r *RabbitMQService) PublishToIncoming(routingKey string, message any) error {
	if r.channel == nil {
		return &gotoolkit.InternalError{Message: "RabbitMQ channel not initialized"}
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		r.logger.Error("failed to marshal message for incoming publish", zap.String("routing_key", routingKey), zap.Error(err))
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
		r.logger.Error("failed to publish message to incoming exchange", zap.String("routing_key", routingKey), zap.Error(err))
		return err
	}

	return nil
}

// PublishToOutgoing publishes a message to the outgoing exchange
func (r *RabbitMQService) PublishToOutgoing(routingKey string, message any) error {
	if r.channel == nil {
		return &gotoolkit.InternalError{Message: "RabbitMQ channel not initialized"}
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		r.logger.Error("failed to marshal message for outgoing publish", zap.String("routing_key", routingKey), zap.Error(err))
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
		r.logger.Error("failed to publish message to outgoing exchange", zap.String("routing_key", routingKey), zap.Error(err))
		return err
	}

	return nil
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

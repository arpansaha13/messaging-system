package broker

import (
	"context"
	"encoding/json"
	"sync"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
)

const (
	IncomingExchange = "incoming_messages"
	OutgoingExchange = "outgoing_messages"
)

// RabbitMQBroker handles RabbitMQ connection and messaging for backend
type RabbitMQBroker struct {
	amqpURL      string
	conn         *amqp.Connection
	channel      *amqp.Channel
	logger       *zap.Logger
	cb           *gobreaker.CircuitBreaker[any]
	mu           sync.RWMutex
	onDisconnect func(err error)
}

// NewRabbitMQBroker creates a new RabbitMQ broker
func NewRabbitMQBroker(amqpURL string, logger *zap.Logger, cb *gobreaker.CircuitBreaker[any]) *RabbitMQBroker {
	return &RabbitMQBroker{
		amqpURL: amqpURL,
		logger:  logger,
		cb:      cb,
	}
}

// declareExchanges declares the required exchanges
func (r *RabbitMQBroker) declareExchanges(ch *amqp.Channel) error {
	if err := ch.ExchangeDeclare(IncomingExchange, "direct", true, false, false, false, nil); err != nil {
		r.logger.Error("failed to declare incoming exchange", zap.String("exchange", IncomingExchange), zap.Error(err))
		return err
	}
	if err := ch.ExchangeDeclare(OutgoingExchange, "direct", true, false, false, false, nil); err != nil {
		r.logger.Error("failed to declare outgoing exchange", zap.String("exchange", OutgoingExchange), zap.Error(err))
		return err
	}
	return nil
}

// Connect establishes the connection and sets up exchanges.
// Safe to call concurrently or repeatedly.
func (r *RabbitMQBroker) Connect(ctx context.Context) error {
	conn, err := gtk.ConnectRabbitMQWithBackoff(ctx, r.amqpURL)
	if err != nil {
		return err
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return err
	}

	if err := r.declareExchanges(ch); err != nil {
		ch.Close()
		conn.Close()
		return err
	}

	r.watchConnection(conn)

	r.mu.Lock()

	r.conn = conn
	r.channel = ch
	r.mu.Unlock()

	return nil
}

// Disconnect closes the connection
func (r *RabbitMQBroker) Disconnect() error {
	r.mu.Lock()
	defer r.mu.Unlock()

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
	r.conn = nil
	r.channel = nil
	r.logger.Info("RabbitMQ disconnected from backend")
	return nil
}

// SetDisconnectHandler sets the handler called when the connection drops
func (r *RabbitMQBroker) SetDisconnectHandler(handler func(err error)) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.onDisconnect = handler
}

func (r *RabbitMQBroker) watchConnection(conn *amqp.Connection) {
	go func() {
		err := <-conn.NotifyClose(make(chan *amqp.Error, 1))
		r.mu.RLock()
		handler := r.onDisconnect
		r.mu.RUnlock()
		if handler != nil {
			handler(err)
		}
	}()
}

// getChannel safely retrieves the channel
func (r *RabbitMQBroker) getChannel() *amqp.Channel {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.channel
}

// IsConnected checks if connected
func (r *RabbitMQBroker) IsConnected() bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.conn != nil && r.channel != nil && !r.conn.IsClosed()
}

// PublishToIncoming publishes a message to the incoming exchange
func (r *RabbitMQBroker) PublishToIncoming(routingKey string, message any) error {
	_, err := r.cb.Execute(func() (any, error) {
		ch := r.getChannel()
		if ch == nil {
			return nil, &gtk.InternalError{Message: "RabbitMQ channel not initialized"}
		}

		messageBytes, err := json.Marshal(message)
		if err != nil {
			r.logger.Error("failed to marshal message for incoming publish", zap.String("routing_key", routingKey), zap.Error(err))
			return nil, err
		}

		err = ch.Publish(
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
func (r *RabbitMQBroker) PublishToOutgoing(routingKey string, message any) error {
	_, err := r.cb.Execute(func() (any, error) {
		ch := r.getChannel()
		if ch == nil {
			return nil, &gtk.InternalError{Message: "RabbitMQ channel not initialized"}
		}

		messageBytes, err := json.Marshal(message)
		if err != nil {
			r.logger.Error("failed to marshal message for outgoing publish", zap.String("routing_key", routingKey), zap.Error(err))
			return nil, err
		}

		err = ch.Publish(
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

// Ensure RabbitMQBroker implements ChatBroker
var _ ChatBroker = (*RabbitMQBroker)(nil)

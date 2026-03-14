package broker

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/arpansaha13/gotoolkit"
	"github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
)

const (
	incomingExchange     = "incoming_messages"
	outgoingExchange     = "outgoing_messages"
	subscriptionExchange = "subscription_data"
)

// RabbitMQBroker implements SocketBroker using RabbitMQ.
//
// Each instance declares two exclusive queues (auto-deleted when the connection
// closes) identified by SERVER_ID:
//   - server-<serverId>       — bound to outgoing_messages exchange
//   - subscription-<serverId> — bound to subscription_data exchange
//
// Routing keys for users, channels, and groups are dynamically bound/unbound
// on connect and disconnect.
type RabbitMQBroker struct {
	amqpURL           string
	serverId          string
	serverQueue       string
	subscriptionQueue string
	conn              *amqp091.Connection
	channel           *amqp091.Channel
	log               *zap.Logger
}

// NewRabbitMQBroker creates a new, unconnected RabbitMQBroker.
func NewRabbitMQBroker(amqpURL, serverId string, log *zap.Logger) *RabbitMQBroker {
	return &RabbitMQBroker{
		amqpURL:           amqpURL,
		serverId:          serverId,
		serverQueue:       fmt.Sprintf("server-%s", serverId),
		subscriptionQueue: fmt.Sprintf("subscription-%s", serverId),
		log:               log,
	}
}

// Connect establishes the RabbitMQ connection with exponential backoff and
// declares all exchanges and per-server exclusive queues.
func (rb *RabbitMQBroker) Connect(ctx context.Context) error {
	conn, err := gotoolkit.ConnectRabbitMQWithBackoff(ctx, rb.amqpURL)
	if err != nil {
		return fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return fmt.Errorf("failed to open channel: %w", err)
	}

	rb.conn = conn
	rb.channel = ch

	if err := rb.declareExchangesAndQueues(); err != nil {
		ch.Close()
		conn.Close()
		return err
	}

	rb.log.Info("connected to RabbitMQ",
		zap.String("server_id", rb.serverId),
		zap.String("server_queue", rb.serverQueue),
	)
	return nil
}

func (rb *RabbitMQBroker) declareExchangesAndQueues() error {
	for _, name := range []string{incomingExchange, outgoingExchange, subscriptionExchange} {
		if err := rb.channel.ExchangeDeclare(name, "direct", true, false, false, false, nil); err != nil {
			return fmt.Errorf("failed to declare exchange %q: %w", name, err)
		}
	}

	// Exclusive queues auto-delete when the connection closes — mirrors the
	// Node.js amqplib behaviour with { exclusive: true }.
	if _, err := rb.channel.QueueDeclare(rb.serverQueue, false, false, true, false, nil); err != nil {
		return fmt.Errorf("failed to declare server queue: %w", err)
	}
	if _, err := rb.channel.QueueDeclare(rb.subscriptionQueue, false, false, true, false, nil); err != nil {
		return fmt.Errorf("failed to declare subscription queue: %w", err)
	}

	// Bind server queue to outgoing exchange with the server ID as routing key
	// so messages targeted at this server instance are delivered here.
	if err := rb.channel.QueueBind(rb.serverQueue, rb.serverId, outgoingExchange, false, nil); err != nil {
		return fmt.Errorf("failed to bind server queue: %w", err)
	}
	// Bind subscription queue to subscription exchange similarly.
	if err := rb.channel.QueueBind(rb.subscriptionQueue, rb.serverId, subscriptionExchange, false, nil); err != nil {
		return fmt.Errorf("failed to bind subscription queue: %w", err)
	}

	return nil
}

// Disconnect closes the channel and connection gracefully.
func (rb *RabbitMQBroker) Disconnect() error {
	if rb.channel != nil {
		if err := rb.channel.Close(); err != nil {
			rb.log.Error("error closing RabbitMQ channel", zap.Error(err))
		}
	}
	if rb.conn != nil {
		if err := rb.conn.Close(); err != nil {
			return fmt.Errorf("error closing RabbitMQ connection: %w", err)
		}
	}
	rb.log.Info("disconnected from RabbitMQ")
	return nil
}

// --- Dynamic binding ---

func (rb *RabbitMQBroker) BindUserToQueue(userId int64) error {
	return rb.bind(fmt.Sprintf("%d", userId))
}

func (rb *RabbitMQBroker) UnbindUserFromQueue(userId int64) error {
	return rb.unbind(fmt.Sprintf("%d", userId))
}

func (rb *RabbitMQBroker) BindChannelToQueue(channelId int64) error {
	return rb.bind(fmt.Sprintf("channel:%d", channelId))
}

func (rb *RabbitMQBroker) UnbindChannelFromQueue(channelId int64) error {
	return rb.unbind(fmt.Sprintf("channel:%d", channelId))
}

func (rb *RabbitMQBroker) BindGroupToQueue(groupId int64) error {
	return rb.bind(fmt.Sprintf("group:%d", groupId))
}

func (rb *RabbitMQBroker) UnbindGroupFromQueue(groupId int64) error {
	return rb.unbind(fmt.Sprintf("group:%d", groupId))
}

func (rb *RabbitMQBroker) bind(routingKey string) error {
	if rb.channel == nil {
		return fmt.Errorf("RabbitMQ channel not initialized")
	}
	if err := rb.channel.QueueBind(rb.serverQueue, routingKey, outgoingExchange, false, nil); err != nil {
		return fmt.Errorf("bind %q: %w", routingKey, err)
	}
	rb.log.Debug("bound routing key", zap.String("key", routingKey))
	return nil
}

func (rb *RabbitMQBroker) unbind(routingKey string) error {
	if rb.channel == nil {
		return fmt.Errorf("RabbitMQ channel not initialized")
	}
	if err := rb.channel.QueueUnbind(rb.serverQueue, routingKey, outgoingExchange, nil); err != nil {
		return fmt.Errorf("unbind %q: %w", routingKey, err)
	}
	rb.log.Debug("unbound routing key", zap.String("key", routingKey))
	return nil
}

// --- Publishing ---

// PublishToIncoming publishes to the incoming_messages exchange (consumed by chat-worker).
func (rb *RabbitMQBroker) PublishToIncoming(routingKey string, message any) error {
	return rb.publish(incomingExchange, routingKey, message)
}

// PublishToOutgoing publishes to the outgoing_messages exchange (consumed by other socket
// server instances). Used for peer-to-peer events such as typing indicators.
func (rb *RabbitMQBroker) PublishToOutgoing(routingKey string, message any) error {
	return rb.publish(outgoingExchange, routingKey, message)
}

func (rb *RabbitMQBroker) publish(exchange, routingKey string, message any) error {
	if rb.channel == nil {
		return fmt.Errorf("RabbitMQ channel not initialized")
	}
	body, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}
	return rb.channel.Publish(exchange, routingKey, false, false, amqp091.Publishing{
		ContentType:  "application/json",
		Body:         body,
		DeliveryMode: amqp091.Persistent,
	})
}

// --- Consuming ---

// ConsumeFromServerQueue starts consuming from the per-server queue. Runs in a
// background goroutine. Messages that cannot be unmarshalled are nack'd without requeue.
func (rb *RabbitMQBroker) ConsumeFromServerQueue(onMessage func(msg *ServerQueueMessage, ack func())) error {
	if rb.channel == nil {
		return fmt.Errorf("RabbitMQ channel not initialized")
	}
	deliveries, err := rb.channel.Consume(rb.serverQueue, "", false, false, false, false, nil)
	if err != nil {
		return fmt.Errorf("consume from server queue: %w", err)
	}

	go func() {
		for d := range deliveries {
			var msg ServerQueueMessage
			if err := json.Unmarshal(d.Body, &msg); err != nil {
				rb.log.Error("failed to unmarshal server queue message", zap.Error(err))
				d.Nack(false, false)
				continue
			}
			onMessage(&msg, func() { d.Ack(false) })
		}
	}()

	rb.log.Info("consuming from server queue", zap.String("queue", rb.serverQueue))
	return nil
}

// ConsumeFromSubscriptionQueue starts consuming from the per-server subscription queue.
func (rb *RabbitMQBroker) ConsumeFromSubscriptionQueue(onMessage func(msg *SubscriptionMessage, ack func())) error {
	if rb.channel == nil {
		return fmt.Errorf("RabbitMQ channel not initialized")
	}
	deliveries, err := rb.channel.Consume(rb.subscriptionQueue, "", false, false, false, false, nil)
	if err != nil {
		return fmt.Errorf("consume from subscription queue: %w", err)
	}

	go func() {
		for d := range deliveries {
			var msg SubscriptionMessage
			if err := json.Unmarshal(d.Body, &msg); err != nil {
				rb.log.Error("failed to unmarshal subscription message", zap.Error(err))
				d.Nack(false, false)
				continue
			}
			onMessage(&msg, func() { d.Ack(false) })
		}
	}()

	rb.log.Info("consuming from subscription queue", zap.String("queue", rb.subscriptionQueue))
	return nil
}

func (rb *RabbitMQBroker) GetServerId() string {
	return rb.serverId
}

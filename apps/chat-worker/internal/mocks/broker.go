package mocks

import (
	"context"
	"sync"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	commonbr "github.com/arpansaha13/messaging-system/apps/common/broker"
)

// MockBroker is an in-memory implementation of the ChatBroker interface
type MockBroker struct {
	mu                   sync.RWMutex
	connected            bool
	publishedMessages    []PublishedMessage
	outgoingMessageQueue chan commonbr.MessagePayload
	connectionEventQueue chan commonbr.UserConnectionPayload
	onDisconnect         func(err error)
}

// PublishedMessage represents a published message for verification in tests
type PublishedMessage struct {
	RoutingKey string
	Message    any
	Topic      string // "outgoing" or "subscription"
}

// NewMockBroker creates a new mock broker
func NewMockBroker() *MockBroker {
	return &MockBroker{
		connected:            false,
		publishedMessages:    make([]PublishedMessage, 0),
		outgoingMessageQueue: make(chan commonbr.MessagePayload, 100),
		connectionEventQueue: make(chan commonbr.UserConnectionPayload, 100),
	}
}

// Connect marks the broker as connected
func (m *MockBroker) Connect(ctx context.Context, opts ...gtk.BackoffOption) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.connected = true
	return nil
}

// Disconnect marks the broker as disconnected
func (m *MockBroker) Disconnect() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.connected = false
	close(m.outgoingMessageQueue)
	close(m.connectionEventQueue)
	return nil
}

// SetDisconnectHandler sets the disconnect handler
func (m *MockBroker) SetDisconnectHandler(handler func(err error)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.onDisconnect = handler
}

// IsConnected returns the connection status
func (m *MockBroker) IsConnected() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.connected
}

// ConsumeWorkerQueue consumes messages from the worker queue (simulated)
func (m *MockBroker) ConsumeWorkerQueue(onMessage func(*commonbr.MessagePayload, func()) error) error {
	go func() {
		for msg := range m.outgoingMessageQueue {
			// In a real test, we'd call onMessage with test payloads
			msgCopy := msg
			_ = onMessage(&msgCopy, func() {})
		}
	}()
	return nil
}

// ConsumeConnectionQueue consumes messages from the connection queue (simulated)
func (m *MockBroker) ConsumeConnectionQueue(onMessage func(*commonbr.UserConnectionPayload, func()) error) error {
	go func() {
		for msg := range m.connectionEventQueue {
			msgCopy := msg
			_ = onMessage(&msgCopy, func() {})
		}
	}()
	return nil
}

// PublishToOutgoing publishes a message to the outgoing exchange
func (m *MockBroker) PublishToOutgoing(routingKey string, message any) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.publishedMessages = append(m.publishedMessages, PublishedMessage{
		RoutingKey: routingKey,
		Message:    message,
		Topic:      "outgoing",
	})

	return nil
}

// PublishToSubscription publishes a message to the subscription exchange
func (m *MockBroker) PublishToSubscription(serverId string, message any) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.publishedMessages = append(m.publishedMessages, PublishedMessage{
		RoutingKey: serverId,
		Message:    message,
		Topic:      "subscription",
	})

	return nil
}

// GetPublishedMessages returns all published messages for verification
func (m *MockBroker) GetPublishedMessages() []PublishedMessage {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.publishedMessages
}

// GetPublishedMessagesByTopic returns published messages filtered by topic
func (m *MockBroker) GetPublishedMessagesByTopic(topic string) []PublishedMessage {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var filtered []PublishedMessage
	for _, msg := range m.publishedMessages {
		if msg.Topic == topic {
			filtered = append(filtered, msg)
		}
	}
	return filtered
}

// GetPublishedMessagesByRoutingKey returns published messages filtered by routing key
func (m *MockBroker) GetPublishedMessagesByRoutingKey(routingKey string) []PublishedMessage {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var filtered []PublishedMessage
	for _, msg := range m.publishedMessages {
		if msg.RoutingKey == routingKey {
			filtered = append(filtered, msg)
		}
	}
	return filtered
}

// ClearPublishedMessages clears all published messages
func (m *MockBroker) ClearPublishedMessages() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.publishedMessages = make([]PublishedMessage, 0)
}

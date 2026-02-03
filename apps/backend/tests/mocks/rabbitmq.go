package mocks

import (
	"sync"

	"github.com/streadway/amqp"
)

// PublishedMessage represents a message published to RabbitMQ
type PublishedMessage struct {
	ExchangeName string
	RoutingKey   string
	Message      []byte
}

// MockRabbitMQService mocks the RabbitMQ service for testing
type MockRabbitMQService struct {
	mu                sync.RWMutex
	publishedTo       []PublishedMessage
	publishToIncoming bool
}

// NewMockRabbitMQService creates a new mock RabbitMQ service
func NewMockRabbitMQService() *MockRabbitMQService {
	return &MockRabbitMQService{
		publishedTo: []PublishedMessage{},
	}
}

// Publish publishes a message to a specific exchange and routing key
func (m *MockRabbitMQService) Publish(exchangeName string, routingKey string, message []byte) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.publishedTo = append(m.publishedTo, PublishedMessage{
		ExchangeName: exchangeName,
		RoutingKey:   routingKey,
		Message:      message,
	})

	return nil
}

// PublishToIncoming publishes a message to the "incoming" routing key
func (m *MockRabbitMQService) PublishToIncoming(message []byte) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.publishedTo = append(m.publishedTo, PublishedMessage{
		ExchangeName: "messages",
		RoutingKey:   "incoming",
		Message:      message,
	})

	m.publishToIncoming = true
	return nil
}

// PublishToOutgoing publishes a message to the "outgoing" routing key
func (m *MockRabbitMQService) PublishToOutgoing(message []byte) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.publishedTo = append(m.publishedTo, PublishedMessage{
		ExchangeName: "messages",
		RoutingKey:   "outgoing",
		Message:      message,
	})

	return nil
}

// PublishToNotifications publishes a message to the "notifications" routing key
func (m *MockRabbitMQService) PublishToNotifications(message []byte) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.publishedTo = append(m.publishedTo, PublishedMessage{
		ExchangeName: "notifications",
		RoutingKey:   "default",
		Message:      message,
	})

	return nil
}

// GetPublishedMessages returns all published messages
func (m *MockRabbitMQService) GetPublishedMessages() []PublishedMessage {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Return a copy to avoid race conditions
	result := make([]PublishedMessage, len(m.publishedTo))
	copy(result, m.publishedTo)
	return result
}

// GetPublishedCount returns the count of published messages
func (m *MockRabbitMQService) GetPublishedCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.publishedTo)
}

// GetPublishToIncomingCalled returns whether PublishToIncoming was called
func (m *MockRabbitMQService) GetPublishToIncomingCalled() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.publishToIncoming
}

// Reset clears all published messages
func (m *MockRabbitMQService) Reset() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.publishedTo = []PublishedMessage{}
	m.publishToIncoming = false
}

// DeclareExchange is a no-op for mocking
func (m *MockRabbitMQService) DeclareExchange(name string, kind string, durable bool) error {
	return nil
}

// DeclareQueue is a no-op for mocking
func (m *MockRabbitMQService) DeclareQueue(name string, durable bool) error {
	return nil
}

// BindQueue is a no-op for mocking
func (m *MockRabbitMQService) BindQueue(queueName string, exchangeName string, routingKey string) error {
	return nil
}

// Consume is a no-op for mocking (returns empty channel)
func (m *MockRabbitMQService) Consume(queueName string) (<-chan amqp.Delivery, error) {
	return make(chan amqp.Delivery), nil
}

// Close is a no-op for mocking
func (m *MockRabbitMQService) Close() error {
	return nil
}

// IsConnected checks if RabbitMQ is connected (always true for mock)
func (m *MockRabbitMQService) IsConnected() bool {
	return true
}

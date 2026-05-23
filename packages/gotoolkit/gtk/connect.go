package gtk

import (
	"context"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/internal/connect"
	"github.com/bradfitz/gomemcache/memcache"
	"github.com/rabbitmq/amqp091-go"
	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gorm.io/gorm"
)

// BackoffOption is a functional option for configuring backoff behavior
type BackoffOption = connect.BackoffOption

// WithMaxRetries sets the maximum number of retry attempts
func WithMaxRetries(n int) BackoffOption {
	return connect.WithMaxRetries(n)
}

// WithPermanentErrorLogLevel sets the log level for permanent errors
func WithPermanentErrorLogLevel(level zapcore.Level) BackoffOption {
	return connect.WithPermanentErrorLogLevel(level)
}

// ConnectPostgresWithBackoff connects to a PostgreSQL database with exponential backoff retry logic.
func ConnectPostgresWithBackoff(ctx context.Context, dsn string, gormCfg *gorm.Config, opts ...BackoffOption) (*gorm.DB, error) {
	return connect.ConnectPostgresWithBackoff(ctx, dsn, gormCfg, opts...)
}

// ConnectRabbitMQWithBackoff connects to RabbitMQ with exponential backoff retry logic.
func ConnectRabbitMQWithBackoff(ctx context.Context, url string, opts ...BackoffOption) (*amqp091.Connection, error) {
	return connect.ConnectRabbitMQWithBackoff(ctx, url, opts...)
}

// ConnectKafkaWithBackoff connects to Kafka with exponential backoff retry logic.
func ConnectKafkaWithBackoff(ctx context.Context, cfg kafka.WriterConfig, opts ...BackoffOption) (*kafka.Writer, error) {
	return connect.ConnectKafkaWithBackoff(ctx, cfg, opts...)
}

// ConnectMemcachedWithBackoff creates a Memcached client and verifies connectivity
func ConnectMemcachedWithBackoff(ctx context.Context, address string, opts ...BackoffOption) (*memcache.Client, error) {
	return connect.ConnectMemcachedWithBackoff(ctx, address, opts...)
}

// ReconnectConfig holds configuration for ConnectionManager reconnection behavior.
type ReconnectConfig = connect.ReconnectConfig

// DefaultReconnectConfig provides sensible defaults for reconnection.
var DefaultReconnectConfig = connect.DefaultReconnectConfig

// ConnectionManager manages resilient reconnection logic for any stateful connection.
type ConnectionManager = connect.ConnectionManager

// NewConnectionManager creates a new resilient connection manager.
func NewConnectionManager(
	config ReconnectConfig,
	logger *zap.Logger,
	connectFn func(ctx context.Context) error,
	disconnectFn func(),
) *ConnectionManager {
	return connect.NewConnectionManager(config, logger, connectFn, disconnectFn)
}

// MemcachedClient is a thread-safe wrapper around memcache.Client for managed reconnections.
type MemcachedClient = connect.MemcachedClient

// NewMemcachedClient creates a new MemcachedClient wrapper.
func NewMemcachedClient() *MemcachedClient {
	return connect.NewMemcachedClient()
}

package connect

import (
	"context"
	"time"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/internal/logger"
	"github.com/cenkalti/backoff/v5"
	"github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
)

// ConnectRabbitMQWithBackoff connects to RabbitMQ with exponential backoff retry logic.
//
// The connection operation is retried with exponential backoff until:
// - Success (returns *amqp091.Connection)
// - MaxElapsedTime exhausted (default 15 minutes)
// - Context cancelled
// - maxRetries exceeded (if WithMaxRetries(n) is set)
//
// Per-attempt logging:
//   - attempt <= 3: Warn level
//   - attempt > 3: Error level
//   - On permanent failure: logs at permanentErrorLogLevel (default: Fatal)
//
// The logger is retrieved from the context via logger.LoggerFromContext,
// falling back to the global logger if not found.
// Note: Channel creation is the caller's responsibility.
func ConnectRabbitMQWithBackoff(ctx context.Context, url string, opts ...BackoffOption) (*amqp091.Connection, error) {
	cfg := applyOptions(opts)

	// Retrieve logger from context or use global
	l := logger.LoggerFromContext(ctx)

	var attempt int

	operation := func() (*amqp091.Connection, error) {
		attempt++

		conn, err := amqp091.Dial(url)
		if err != nil {
			if attempt <= 3 {
				l.Warn("failed to connect to rabbitmq", zap.Int("attempt", attempt), zap.Error(err))
			} else {
				l.Error("failed to connect to rabbitmq", zap.Int("attempt", attempt), zap.Error(err))
			}

			if cfg.maxRetries > 0 && attempt >= cfg.maxRetries {
				return nil, backoff.Permanent(err)
			}

			return nil, err
		}

		return conn, nil
	}

	retryOpts := []backoff.RetryOption{
		backoff.WithNotify(func(err error, d time.Duration) {
			// Notification on retry — no-op here
		}),
	}

	if cfg.maxRetries > 0 {
		retryOpts = append(retryOpts, backoff.WithMaxTries(uint(cfg.maxRetries)))
	}

	conn, retryErr := backoff.Retry(ctx, operation, retryOpts...)

	if retryErr != nil {
		l.Log(cfg.permanentErrorLogLevel, "permanently failed to connect to rabbitmq", zap.Error(retryErr))
		return nil, retryErr
	}

	return conn, nil
}

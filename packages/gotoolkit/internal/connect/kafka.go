package connect

import (
	"context"
	"errors"
	"time"

	"github.com/cenkalti/backoff/v5"
	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/internal/logger"
)

// ConnectKafkaWithBackoff connects to Kafka with exponential backoff retry logic.
//
// The connection operation verifies connectivity by dialing the first broker,
// then returns a new kafka.Writer with the provided config.
// The dial connection is closed immediately after verification.
//
// The operation is retried with exponential backoff until:
// - Success (returns *kafka.Writer)
// - MaxElapsedTime exhausted (default 15 minutes)
// - Context cancelled
// - maxRetries exceeded (if WithMaxRetries(n) is set)
//
// If cfg.Brokers is empty, immediately returns a Permanent error.
//
// Per-attempt logging:
//   - attempt <= 3: Warn level
//   - attempt > 3: Error level
//   - On permanent failure: logs at permanentErrorLogLevel (default: Fatal)
//
// The logger is retrieved from the context via logger.LoggerFromContext,
// falling back to the global logger if not found.
func ConnectKafkaWithBackoff(ctx context.Context, cfg kafka.WriterConfig, opts ...BackoffOption) (*kafka.Writer, error) {
	backoffCfg := applyOptions(opts)

	// Retrieve logger from context or use global
	l := logger.LoggerFromContext(ctx)

	// Check if brokers are configured
	if len(cfg.Brokers) == 0 {
		err := errors.New("kafka brokers not configured")
		l.Log(backoffCfg.permanentErrorLogLevel, "failed to connect to kafka", zap.Error(err))
		return nil, backoff.Permanent(err)
	}

	var attempt int

	operation := func() (*kafka.Writer, error) {
		attempt++

		// Verify connectivity by dialing the first broker
		dialCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		conn, err := kafka.DialContext(dialCtx, "tcp", cfg.Brokers[0])
		cancel()

		if err != nil {
			if attempt <= 3 {
				l.Warn("failed to connect to kafka", zap.Int("attempt", attempt), zap.Error(err))
			} else {
				l.Error("failed to connect to kafka", zap.Int("attempt", attempt), zap.Error(err))
			}

			if backoffCfg.maxRetries > 0 && attempt >= backoffCfg.maxRetries {
				return nil, backoff.Permanent(err)
			}

			return nil, err
		}

		// Close the verification connection immediately
		conn.Close()

		// If verification succeeded, create and return the writer
		writer := kafka.NewWriter(cfg)
		return writer, nil
	}

	retryOpts := []backoff.RetryOption{
		backoff.WithNotify(func(err error, d time.Duration) {
			// Notification on retry — no-op here
		}),
	}

	if backoffCfg.maxRetries > 0 {
		retryOpts = append(retryOpts, backoff.WithMaxTries(uint(backoffCfg.maxRetries)))
	}

	writer, retryErr := backoff.Retry(ctx, operation, retryOpts...)

	if retryErr != nil {
		l.Log(backoffCfg.permanentErrorLogLevel, "permanently failed to connect to kafka", zap.Error(retryErr))
		return nil, retryErr
	}

	return writer, nil
}

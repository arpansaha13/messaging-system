package connect

import (
	"context"
	"time"

	"github.com/cenkalti/backoff/v5"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/internal/logger"
)

// ConnectPostgresWithBackoff connects to a PostgreSQL database with exponential backoff retry logic.
//
// The connection operation is retried with exponential backoff until:
// - Success (returns *gorm.DB)
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
func ConnectPostgresWithBackoff(ctx context.Context, dsn string, gormCfg *gorm.Config, opts ...BackoffOption) (*gorm.DB, error) {
	cfg := applyOptions(opts)

	// Retrieve logger from context or use global
	l := logger.LoggerFromContext(ctx)

	var attempt int

	operation := func() (*gorm.DB, error) {
		attempt++

		db, err := gorm.Open(postgres.Open(dsn), gormCfg)
		if err != nil {
			if attempt <= 3 {
				l.Warn("failed to connect to postgres", zap.Int("attempt", attempt), zap.Error(err))
			} else {
				l.Error("failed to connect to postgres", zap.Int("attempt", attempt), zap.Error(err))
			}

			if cfg.maxRetries > 0 && attempt >= cfg.maxRetries {
				return nil, backoff.Permanent(err)
			}

			return nil, err
		}

		return db, nil
	}

	retryOpts := []backoff.RetryOption{
		backoff.WithNotify(func(err error, d time.Duration) {
			// Notification on retry — no-op here
		}),
	}

	if cfg.maxRetries > 0 {
		retryOpts = append(retryOpts, backoff.WithMaxTries(uint(cfg.maxRetries)))
	}

	db, retryErr := backoff.Retry(ctx, operation, retryOpts...)

	if retryErr != nil {
		l.Log(cfg.permanentErrorLogLevel, "permanently failed to connect to postgres", zap.Error(retryErr))
		return nil, retryErr
	}

	return db, nil
}

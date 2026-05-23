package connect

import (
	"context"
	"time"

	"github.com/bradfitz/gomemcache/memcache"
	"github.com/cenkalti/backoff/v5"
	"go.uber.org/zap"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/internal/logger"
)

// ConnectMemcachedWithBackoff creates a Memcached client and verifies connectivity
// with exponential backoff retry logic.
//
// Connectivity is verified by issuing a Get request for a probe key. A cache miss
// (ErrCacheMiss) is treated as success — the server responded, the key just
// doesn't exist. Network or connection errors are retried.
//
// The returned client is ready to use; its internal connection pool is managed
// lazily by gomemcache on subsequent calls.
//
// The operation is retried with exponential backoff until:
//   - Success (returns *memcache.Client)
//   - MaxElapsedTime exhausted (default 15 minutes)
//   - Context cancelled
//   - maxRetries exceeded (if WithMaxRetries(n) is set)
//
// Per-attempt logging:
//   - attempt <= 3: Warn level
//   - attempt > 3: Error level
//   - On permanent failure: logs at permanentErrorLogLevel (default: Fatal)
//
// The logger is retrieved from the context via logger.LoggerFromContext,
// falling back to the global logger if not found.
func ConnectMemcachedWithBackoff(ctx context.Context, address string, opts ...BackoffOption) (*memcache.Client, error) {
	cfg := applyOptions(opts)

	// Retrieve logger from context or use global
	l := logger.LoggerFromContext(ctx)

	var attempt int

	operation := func() (*memcache.Client, error) {
		attempt++

		client := memcache.New(address)

		// Probe connectivity: a cache miss means the server is reachable.
		_, err := client.Get("__health_probe__")
		if err == nil || err == memcache.ErrCacheMiss {
			return client, nil
		}

		if attempt <= 3 {
			l.Warn("failed to connect to memcached", zap.Int("attempt", attempt), zap.Error(err))
		} else {
			l.Error("failed to connect to memcached", zap.Int("attempt", attempt), zap.Error(err))
		}

		if cfg.maxRetries > 0 && attempt >= cfg.maxRetries {
			return nil, backoff.Permanent(err)
		}

		return nil, err
	}

	retryOpts := []backoff.RetryOption{
		backoff.WithNotify(func(err error, d time.Duration) {
			// Notification on retry — no-op here
		}),
	}

	if cfg.maxRetries > 0 {
		retryOpts = append(retryOpts, backoff.WithMaxTries(uint(cfg.maxRetries)))
	}

	client, retryErr := backoff.Retry(ctx, operation, retryOpts...)

	if retryErr != nil {
		l.Log(cfg.permanentErrorLogLevel, "permanently failed to connect to memcached", zap.Error(retryErr))
		return nil, retryErr
	}

	return client, nil
}

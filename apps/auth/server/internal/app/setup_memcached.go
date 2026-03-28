package app

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/bradfitz/gomemcache/memcache"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/auth/server/internal/config"
)

// SetupMemcached initializes the memcached client with auto-reconnect via ConnectionManager.
// Returns (*gotoolkit.MemcachedClient, *gotoolkit.ConnectionManager, error).
// If memcached is not configured, returns (nil, nil, nil) - cache is optional.
func SetupMemcached(
	ctx context.Context,
	log *zap.Logger,
) (*gotoolkit.MemcachedClient, *gotoolkit.ConnectionManager, error) {
	cfg, _ := config.Load()
	creds := cfg.Memcached()

	// If memcached not configured, return nil gracefully
	if creds.GetUrl() == "" || creds.Host == "" {
		log.Info("memcached not configured, session caching disabled")
		return nil, nil, nil
	}

	managedClient := gotoolkit.NewMemcachedClient()

	memcachedConnMgr := gotoolkit.NewConnectionManager(
		gotoolkit.ReconnectConfig{
			ConnectTimeout:    15 * time.Second,
			ReconnectInterval: 500 * time.Millisecond,
		},
		log,
		func(connectCtx context.Context) error {
			client, err := gotoolkit.ConnectMemcachedWithBackoff(
				connectCtx,
				creds.GetUrl(),
				gotoolkit.WithPermanentErrorLogLevel(zapcore.ErrorLevel),
			)
			if err != nil {
				return fmt.Errorf("failed to connect to memcached: %w", err)
			}
			managedClient.SetClient(client)
			log.Info("memcached connected", zap.String("address", creds.GetUrl()))
			return nil
		},
		func() {
			managedClient.SetClient(nil)
			log.Info("memcached disconnected")
		},
	)

	if err := memcachedConnMgr.Start(ctx); err != nil {
		return nil, nil, fmt.Errorf("failed to start memcached connection manager: %w", err)
	}

	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				client := managedClient.GetClient()
				if client == nil {
					memcachedConnMgr.Signal()
					continue
				}
				if _, err := client.Get("__health_probe__"); err != nil && !errors.Is(err, memcache.ErrCacheMiss) {
					log.Warn("memcached heartbeat failed, triggering reconnect", zap.Error(err))
					memcachedConnMgr.Signal()
				}
			}
		}
	}()

	return managedClient, memcachedConnMgr, nil
}

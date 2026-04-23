package app

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/cache"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/config"
	"github.com/bradfitz/gomemcache/memcache"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// setupMemcached creates a MemcachedService and a ConnectionManager with auto-reconnect.
// Returns the service (for injection into app) and the manager (for graceful shutdown in main).
func SetupMemcached(
	ctx context.Context,
	creds config.MemcachedCreds,
	log *zap.Logger,
) (*cache.MemcachedService, *gtk.ConnectionManager, error) {
	memcachedService := cache.NewMemcachedService()

	memcachedConnMgr := gtk.NewConnectionManager(
		gtk.ReconnectConfig{
			ConnectTimeout:    15 * time.Second,
			ReconnectInterval: 500 * time.Millisecond,
		},
		log,
		func(connectCtx context.Context) error {
			client, err := gtk.ConnectMemcachedWithBackoff(
				connectCtx,
				creds.GetUrl(),
				gtk.WithPermanentErrorLogLevel(zapcore.ErrorLevel),
			)
			if err != nil {
				return fmt.Errorf("failed to connect to memcached: %w", err)
			}
			memcachedService.SetClient(client)
			log.Info("memcached connected", zap.String("address", creds.GetUrl()))
			return nil
		},
		func() {
			memcachedService.UnsetClient()
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
				client := memcachedService.GetClient()
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

	return memcachedService, memcachedConnMgr, nil
}

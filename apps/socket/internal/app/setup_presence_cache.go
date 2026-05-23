package app

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/cache"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/config"
	"github.com/bradfitz/gomemcache/memcache"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// SetupPresenceCache creates a PresenceCache and a ConnectionManager with auto-reconnect.
// Returns the presence cache (for injection into app) and the manager (for graceful shutdown in main).
func SetupPresenceCache(
	ctx context.Context,
	creds config.MemcachedCreds,
	log *zap.Logger,
) (cache.PresenceCache, *gtk.ConnectionManager, error) {
	presenceCache := cache.NewMemcachedPresenceCache()

	presenceCacheConnMgr := gtk.NewConnectionManager(
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
				return fmt.Errorf("failed to connect to presence cache: %w", err)
			}
			presenceCache.SetClient(client)
			log.Info("presence cache connected", zap.String("address", creds.GetUrl()))
			return nil
		},
		func() {
			presenceCache.UnsetClient()
			log.Info("presence cache disconnected")
		},
	)

	if err := presenceCacheConnMgr.Start(ctx); err != nil {
		return nil, nil, fmt.Errorf("failed to start presence cache connection manager: %w", err)
	}

	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				client := presenceCache.GetClient()
				if client == nil {
					presenceCacheConnMgr.Signal()
					continue
				}
				if _, err := client.Get("__health_probe__"); err != nil && !errors.Is(err, memcache.ErrCacheMiss) {
					log.Warn("presence cache heartbeat failed, triggering reconnect", zap.Error(err))
					presenceCacheConnMgr.Signal()
				}
			}
		}
	}()

	return presenceCache, presenceCacheConnMgr, nil
}

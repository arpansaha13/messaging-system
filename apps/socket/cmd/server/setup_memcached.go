package main

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/cache"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/config"
)

// setupMemcached creates a MemcachedService and a ConnectionManager with auto-reconnect.
// Returns the service (for injection into app) and the manager (for graceful shutdown in main).
func setupMemcached(
	ctx context.Context,
	creds config.MemcachedCreds,
	log *zap.Logger,
) (*cache.MemcachedService, *gotoolkit.ConnectionManager, error) {
	memcachedService := cache.NewMemcachedService()

	memcachedConnMgr := gotoolkit.NewConnectionManager(
		gotoolkit.ReconnectConfig{
			ConnectTimeout:    15 * time.Second,
			ReconnectInterval: 500 * time.Millisecond,
		},
		log,
		func(connectCtx context.Context) error {
			client, err := gotoolkit.ConnectMemcachedWithBackoff(connectCtx, creds.GetUrl())
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

	return memcachedService, memcachedConnMgr, nil
}

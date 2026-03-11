package main

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"github.com/arpansaha13/messaging-system/apps/socket-go/internal/cache"
)

// setupMemcached initializes the Memcached service for online status tracking.
func setupMemcached(
	ctx context.Context,
	log *zap.Logger,
	memcachedHost string,
	memcachedPort string,
) (*cache.MemcachedService, error) {
	memcachedAddr := fmt.Sprintf("%s:%s", memcachedHost, memcachedPort)
	memcachedSvc, err := cache.NewMemcachedService(ctx, memcachedAddr)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to memcached: %w", err)
	}

	return memcachedSvc, nil
}

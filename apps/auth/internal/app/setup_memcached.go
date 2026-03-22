package app

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/bradfitz/gomemcache/memcache"
	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/auth/internal/config"
)

// MemcachedClient is a thread-safe wrapper around memcache.Client for managed reconnections.
// It delegates all operations to the currently managed client, allowing seamless reconnects.
type MemcachedClient struct {
	mu     sync.RWMutex
	client *memcache.Client
}

// SetClient updates the underlying memcached client (called by ConnectionManager).
func (m *MemcachedClient) SetClient(client *memcache.Client) {
	if m == nil {
		return
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	m.client = client
}

// getClient safely retrieves the current memcached client.
func (m *MemcachedClient) getClient() *memcache.Client {
	if m == nil {
		return nil
	}
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.client
}

// Get retrieves an item from memcached (delegates to underlying client).
func (m *MemcachedClient) Get(key string) (*memcache.Item, error) {
	client := m.getClient()
	if client == nil {
		return nil, memcache.ErrCacheMiss
	}
	return client.Get(key)
}

// Set stores an item in memcached (delegates to underlying client).
func (m *MemcachedClient) Set(item *memcache.Item) error {
	client := m.getClient()
	if client == nil {
		return nil // Best-effort: silently ignore if disconnected
	}
	return client.Set(item)
}

// Delete removes an item from memcached (delegates to underlying client).
func (m *MemcachedClient) Delete(key string) error {
	client := m.getClient()
	if client == nil {
		return nil // Best-effort: silently ignore if disconnected
	}
	return client.Delete(key)
}

// SetupMemcached initializes the memcached client with auto-reconnect via ConnectionManager.
// Returns (*MemcachedClient, *gotoolkit.ConnectionManager, error).
// If memcached is not configured, returns (nil, nil, nil) - cache is optional.
func SetupMemcached(
	ctx context.Context,
	log *zap.Logger,
) (*MemcachedClient, *gotoolkit.ConnectionManager, error) {
	cfg, _ := config.Load()
	creds := cfg.Memcached()

	// If memcached not configured, return nil gracefully
	if creds.GetUrl() == "" || creds.Host == "" {
		log.Info("memcached not configured, session caching disabled")
		return nil, nil, nil
	}

	managedClient := &MemcachedClient{}

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

	return managedClient, memcachedConnMgr, nil
}

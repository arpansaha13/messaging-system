package connect

import (
	"sync"

	"github.com/bradfitz/gomemcache/memcache"
)

// MemcachedClient is a thread-safe wrapper around memcache.Client for managed reconnections.
// It delegates all operations to the currently managed client, allowing seamless reconnects.
// This is a generic wrapper with no business logic.
type MemcachedClient struct {
	mu     sync.RWMutex
	client *memcache.Client
}

// NewMemcachedClient creates a new MemcachedClient wrapper.
func NewMemcachedClient() *MemcachedClient {
	return &MemcachedClient{}
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

// GetClient safely retrieves the current memcached client.
func (m *MemcachedClient) GetClient() *memcache.Client {
	if m == nil {
		return nil
	}
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.client
}

// Get retrieves an item from memcached (delegates to underlying client).
func (m *MemcachedClient) Get(key string) (*memcache.Item, error) {
	client := m.GetClient()
	if client == nil {
		return nil, memcache.ErrCacheMiss
	}
	return client.Get(key)
}

// Set stores an item in memcached (delegates to underlying client).
func (m *MemcachedClient) Set(item *memcache.Item) error {
	client := m.GetClient()
	if client == nil {
		return nil // Best-effort: silently ignore if disconnected
	}
	return client.Set(item)
}

// Delete removes an item from memcached (delegates to underlying client).
func (m *MemcachedClient) Delete(key string) error {
	client := m.GetClient()
	if client == nil {
		return nil // Best-effort: silently ignore if disconnected
	}
	return client.Delete(key)
}

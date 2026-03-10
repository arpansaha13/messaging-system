package cache

import (
	"context"
	"fmt"
	"sync"

	"github.com/arpansaha13/gotoolkit"
	"github.com/bradfitz/gomemcache/memcache"
)

// MemcachedService manages user online-status keys in Memcached.
//
// Key format: "user:online:<userId>"
// Value:      "1"  (presence marker; TTL drives expiry)
//
// Note on protocol: the Node.js counterpart (memjs) uses Memcached's binary
// protocol, while gomemcache uses the text protocol. Both read and write the
// same byte values on the server, so there is no data incompatibility.
type MemcachedService struct {
	client *memcache.Client
}

// NewMemcachedService creates a MemcachedService with a verified connection.
// address should be "host:port".
func NewMemcachedService(ctx context.Context, address string) (*MemcachedService, error) {
	client, err := gotoolkit.ConnectMemcachedWithBackoff(ctx, address)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to memcached: %w", err)
	}
	return &MemcachedService{client: client}, nil
}

// SetOnline marks userId as online with the given TTL in seconds.
func (m *MemcachedService) SetOnline(userId int64, ttl int32) error {
	return m.client.Set(&memcache.Item{
		Key:        m.key(userId),
		Value:      []byte("1"),
		Expiration: ttl,
	})
}

// SetBatchOnline marks all userIds as online concurrently.
// Returns the first error encountered; other sets may still succeed.
func (m *MemcachedService) SetBatchOnline(userIds []int64, ttl int32) error {
	if len(userIds) == 0 {
		return nil
	}

	errs := make([]error, len(userIds))
	var wg sync.WaitGroup
	wg.Add(len(userIds))

	for i, userId := range userIds {
		i, userId := i, userId
		go func() {
			defer wg.Done()
			errs[i] = m.SetOnline(userId, ttl)
		}()
	}

	wg.Wait()

	for _, err := range errs {
		if err != nil {
			return err
		}
	}
	return nil
}

// GetBatchOnlineStatus returns a map of userId → isOnline for the given IDs.
// A cache miss is treated as offline. Network errors are also treated as offline
// and the first such error is returned alongside the (partial) status map.
func (m *MemcachedService) GetBatchOnlineStatus(userIds []int64) (map[int64]bool, error) {
	type result struct {
		userId   int64
		isOnline bool
		err      error
	}

	results := make([]result, len(userIds))
	var wg sync.WaitGroup
	wg.Add(len(userIds))

	for i, userId := range userIds {
		i, userId := i, userId
		go func() {
			defer wg.Done()
			_, err := m.client.Get(m.key(userId))
			switch {
			case err == nil:
				results[i] = result{userId: userId, isOnline: true}
			case err == memcache.ErrCacheMiss:
				results[i] = result{userId: userId, isOnline: false}
			default:
				results[i] = result{userId: userId, isOnline: false, err: err}
			}
		}()
	}

	wg.Wait()

	statuses := make(map[int64]bool, len(userIds))
	var firstErr error
	for _, r := range results {
		statuses[r.userId] = r.isOnline
		if r.err != nil && firstErr == nil {
			firstErr = r.err
		}
	}
	return statuses, firstErr
}

func (m *MemcachedService) key(userId int64) string {
	return fmt.Sprintf("user:online:%d", userId)
}

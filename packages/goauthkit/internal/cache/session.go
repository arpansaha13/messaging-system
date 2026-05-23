package cache

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/bradfitz/gomemcache/memcache"
	"github.com/sony/gobreaker/v2"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
)

// MemcachedSessionCache implements ISessionCache using memcached as the backend with circuit breaker protection.
type MemcachedSessionCache struct {
	client *gtk.MemcachedClient
	cb     *gobreaker.CircuitBreaker[any]
}

// NewMemcachedSessionCache creates a new session cache with memcached client wrapper and circuit breaker.
// If either client or circuit breaker is nil, operations become no-ops (graceful degradation).
func NewMemcachedSessionCache(client *gtk.MemcachedClient, cb *gobreaker.CircuitBreaker[any]) *MemcachedSessionCache {
	return &MemcachedSessionCache{
		client: client,
		cb:     cb,
	}
}

// GetSessionByToken retrieves a full session from cache by token hash.
func (c *MemcachedSessionCache) GetSessionByToken(ctx context.Context, tokenHash string) (*domain.Session, error) {
	if c.client == nil || c.cb == nil {
		return nil, &gtk.NotFoundError{Message: "cache not available"}
	}

	cacheKey := fmt.Sprintf("session:%s", tokenHash)

	result, err := c.cb.Execute(func() (any, error) {
		item, err := c.client.Get(cacheKey)
		if err != nil {
			if errors.Is(err, memcache.ErrCacheMiss) {
				return nil, &gtk.NotFoundError{Message: "session not found in cache"}
			}
			return nil, err
		}
		return item, nil
	})

	if err != nil {
		// If circuit breaker is open or cache miss, return not found
		if errors.Is(err, &gtk.NotFoundError{}) {
			return nil, err
		}
		// For other errors (network, etc.), return internal error
		return nil, &gtk.InternalError{Message: "failed to get session from cache", Err: err}
	}

	item := result.(*memcache.Item)
	var session domain.Session
	if err := json.Unmarshal(item.Value, &session); err != nil {
		return nil, &gtk.InternalError{Message: "failed to unmarshal session from cache", Err: err}
	}

	return &session, nil
}

// IsTokenValid checks if a token is valid in cache (exists, not expired, not deleted).
func (c *MemcachedSessionCache) IsTokenValid(ctx context.Context, tokenHash string) (bool, int64, error) {
	if c.client == nil || c.cb == nil {
		// Cache not available, return cache miss - caller will use database
		return false, 0, &gtk.NotFoundError{Message: "cache not available"}
	}

	cacheKey := fmt.Sprintf("token_valid:%s", tokenHash)

	result, err := c.cb.Execute(func() (any, error) {
		item, err := c.client.Get(cacheKey)
		if err != nil {
			if errors.Is(err, memcache.ErrCacheMiss) {
				return nil, &gtk.NotFoundError{Message: "token validity not found in cache"}
			}
			return nil, err
		}
		return item, nil
	})

	if err != nil {
		// If circuit breaker is open or cache miss, return not found (caller will use DB)
		if errors.Is(err, &gtk.NotFoundError{}) {
			return false, 0, err
		}
		// For other errors, return internal error
		return false, 0, &gtk.InternalError{Message: "failed to check token validity in cache", Err: err}
	}

	item := result.(*memcache.Item)
	var data struct {
		Valid  bool  `json:"valid"`
		UserID int64 `json:"user_id"`
	}

	if err := json.Unmarshal(item.Value, &data); err != nil {
		return false, 0, &gtk.InternalError{Message: "failed to unmarshal token validity from cache", Err: err}
	}

	return data.Valid, data.UserID, nil
}

// SetSession stores a session in cache with a TTL.
// Errors are logged but not fatal - cache operations are best-effort.
func (c *MemcachedSessionCache) SetSession(ctx context.Context, tokenHash string, session *domain.Session, ttl time.Duration) error {
	if c.client == nil || c.cb == nil {
		return nil // Cache not available, no-op
	}

	// Serialize session to JSON
	sessionJSON, err := json.Marshal(session)
	if err != nil {
		return fmt.Errorf("failed to marshal session: %w", err)
	}

	// Cache the full session
	cacheKey := fmt.Sprintf("session:%s", tokenHash)
	ttlSeconds := int32(ttl.Seconds())
	if ttlSeconds <= 0 {
		ttlSeconds = 1 // Minimum TTL
	}

	_, execErr := c.cb.Execute(func() (any, error) {
		item := &memcache.Item{
			Key:        cacheKey,
			Value:      sessionJSON,
			Expiration: ttlSeconds,
		}
		return nil, c.client.Set(item)
	})

	if execErr != nil {
		// Log but don't fail - cache is best-effort
		return fmt.Errorf("failed to set session in cache: %w", execErr)
	}

	// Also cache the token validity for faster IsTokenValid checks
	tokenValidData, err := json.Marshal(map[string]any{
		"valid":   true,
		"user_id": session.UserID,
	})
	if err != nil {
		return fmt.Errorf("failed to marshal token validity: %w", err)
	}

	tokenValidKey := fmt.Sprintf("token_valid:%s", tokenHash)
	_, execErr = c.cb.Execute(func() (any, error) {
		item := &memcache.Item{
			Key:        tokenValidKey,
			Value:      tokenValidData,
			Expiration: ttlSeconds,
		}
		return nil, c.client.Set(item)
	})

	if execErr != nil {
		// Log but don't fail - cache is best-effort
		return fmt.Errorf("failed to set token validity in cache: %w", execErr)
	}

	return nil
}

// InvalidateSessionToken removes a session token from cache.
// Errors are logged but not fatal - cache operations are best-effort.
func (c *MemcachedSessionCache) InvalidateSessionToken(ctx context.Context, tokenHash string) error {
	if c.client == nil || c.cb == nil {
		return nil // Cache not available, no-op
	}

	// Function to delete session cache entry
	deleteCacheKey := func(key string) error {
		_, execErr := c.cb.Execute(func() (any, error) {
			return nil, c.client.Delete(key)
		})

		if execErr != nil && !errors.Is(execErr, memcache.ErrCacheMiss) {
			return execErr
		}

		return nil
	}

	// Delete session and token validity cache entries
	cacheKey := fmt.Sprintf("session:%s", tokenHash)
	tokenValidKey := fmt.Sprintf("token_valid:%s", tokenHash)

	if err := deleteCacheKey(cacheKey); err != nil {
		// Log but don't fail - cache is best-effort
		return fmt.Errorf("failed to delete session from cache: %w", err)
	}

	if err := deleteCacheKey(tokenValidKey); err != nil {
		// Log but don't fail - cache is best-effort
		return fmt.Errorf("failed to delete token validity from cache: %w", err)
	}

	// Double delete prevents stale session entries from being re-cached by concurrent readers.
	time.Sleep(25 * time.Millisecond)

	if err := deleteCacheKey(cacheKey); err != nil {
		// Log but don't fail - cache is best-effort
		return fmt.Errorf("failed to delete session from cache (second pass): %w", err)
	}

	if err := deleteCacheKey(tokenValidKey); err != nil {
		// Log but don't fail - cache is best-effort
		return fmt.Errorf("failed to delete token validity from cache (second pass): %w", err)
	}

	return nil
}

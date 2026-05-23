package cache

import (
	"context"
	"time"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
)

// ISessionCache defines the interface for session cache operations.
// Implementations are responsible for caching session data with optional circuit breaker protection.
// All methods are context-aware and handle errors gracefully.
type ISessionCache interface {
	// GetSessionByToken retrieves a full session from cache by token hash.
	// Returns NotFoundError if the token is not in cache.
	GetSessionByToken(ctx context.Context, tokenHash string) (*domain.Session, error)

	// IsTokenValid checks if a token is valid in cache (exists, not expired, not deleted).
	// Returns (valid bool, userID int64, error).
	IsTokenValid(ctx context.Context, tokenHash string) (bool, int64, error)

	// SetSession stores a session in cache with a TTL.
	// Errors are logged but not fatal - cache is best-effort.
	SetSession(ctx context.Context, tokenHash string, session *domain.Session, ttl time.Duration) error

	// InvalidateSessionToken removes a session token from cache.
	// Errors are logged but not fatal - cache is best-effort.
	InvalidateSessionToken(ctx context.Context, tokenHash string) error
}

// Compile-time check to ensure MemcachedSessionCache implements ISessionCache
var _ ISessionCache = (*MemcachedSessionCache)(nil)

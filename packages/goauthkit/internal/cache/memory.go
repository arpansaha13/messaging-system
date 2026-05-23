package cache

import (
	"context"
	"sync"
	"time"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
)

// InMemorySessionCache is an in-memory implementation of ISessionCache.
type InMemorySessionCache struct {
	mu       sync.RWMutex
	sessions map[string]*domain.Session
}

func NewInMemorySessionCache() *InMemorySessionCache {
	return &InMemorySessionCache{
		sessions: make(map[string]*domain.Session),
	}
}

func (m *InMemorySessionCache) GetSessionByToken(ctx context.Context, tokenHash string) (*domain.Session, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	session, ok := m.sessions[tokenHash]
	if !ok {
		return nil, nil // Or NotFoundError if required by interface contract
	}

	if session.ExpiresAt.Before(time.Now()) {
		return nil, nil
	}

	return session, nil
}

func (m *InMemorySessionCache) IsTokenValid(ctx context.Context, tokenHash string) (bool, int64, error) {
	session, err := m.GetSessionByToken(ctx, tokenHash)
	if err != nil || session == nil {
		return false, 0, err
	}
	return true, session.UserID, nil
}

func (m *InMemorySessionCache) SetSession(ctx context.Context, tokenHash string, session *domain.Session, ttl time.Duration) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.sessions[tokenHash] = session
	return nil
}

func (m *InMemorySessionCache) InvalidateSessionToken(ctx context.Context, tokenHash string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.sessions, tokenHash)
	return nil
}

// Compile-time check to ensure InMemorySessionCache implements ISessionCache
var _ ISessionCache = (*InMemorySessionCache)(nil)

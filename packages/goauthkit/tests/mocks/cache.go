package mocks

import (
	"context"
	"time"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
)

type MockSessionCache struct {
	GetSessionByTokenFunc      func(ctx context.Context, tokenHash string) (*domain.Session, error)
	IsTokenValidFunc           func(ctx context.Context, tokenHash string) (bool, int64, error)
	SetSessionFunc             func(ctx context.Context, tokenHash string, session *domain.Session, ttl time.Duration) error
	InvalidateSessionTokenFunc func(ctx context.Context, tokenHash string) error
}

func (m *MockSessionCache) GetSessionByToken(ctx context.Context, tokenHash string) (*domain.Session, error) {
	if m.GetSessionByTokenFunc != nil {
		return m.GetSessionByTokenFunc(ctx, tokenHash)
	}
	return nil, nil
}

func (m *MockSessionCache) IsTokenValid(ctx context.Context, tokenHash string) (bool, int64, error) {
	if m.IsTokenValidFunc != nil {
		return m.IsTokenValidFunc(ctx, tokenHash)
	}
	return false, 0, context.DeadlineExceeded // Return error to trigger fallback in tests
}

func (m *MockSessionCache) SetSession(ctx context.Context, tokenHash string, session *domain.Session, ttl time.Duration) error {
	if m.SetSessionFunc != nil {
		return m.SetSessionFunc(ctx, tokenHash, session, ttl)
	}
	return nil
}

func (m *MockSessionCache) InvalidateSessionToken(ctx context.Context, tokenHash string) error {
	if m.InvalidateSessionTokenFunc != nil {
		return m.InvalidateSessionTokenFunc(ctx, tokenHash)
	}
	return nil
}

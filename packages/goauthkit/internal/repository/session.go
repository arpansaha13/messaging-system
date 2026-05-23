package repository

import (
	"context"
	"errors"
	"time"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
)

// SessionRepository handles session-related database operations
type SessionRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewSessionRepository creates a new session repository
func NewSessionRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *SessionRepository {
	return &SessionRepository{db: db, cb: cb}
}

// Create creates a new session
func (r *SessionRepository) Create(ctx context.Context, session *domain.Session) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(session).Error
	})
	return err
}

// GetByTokenHash retrieves a session by token hash
func (r *SessionRepository) GetByTokenHash(ctx context.Context, tokenHash string) (*domain.Session, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var session domain.Session
		err := r.db.WithContext(ctx).
			Where("token_hash = ?", tokenHash).
			First(&session).Error
		if err != nil {
			return nil, err
		}
		return &session, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "session not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get session", Err: err}
	}

	return result.(*domain.Session), nil
}

// GetByUserID retrieves all valid sessions for a user
func (r *SessionRepository) GetByUserID(ctx context.Context, userID int64) ([]domain.Session, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var sessions []domain.Session
		err := r.db.WithContext(ctx).
			Where("user_id = ? AND expires_at > ?", userID, time.Now()).
			Find(&sessions).Error
		if err != nil {
			return nil, err
		}
		return sessions, nil
	})

	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to get sessions", Err: err}
	}

	return result.([]domain.Session), nil
}

// Update updates a session
func (r *SessionRepository) Update(ctx context.Context, session *domain.Session) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Save(session).Error
	})
	return err
}

// Delete removes a session (hard delete)
func (r *SessionRepository) Delete(ctx context.Context, sessionID int64) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).
			Where("id = ?", sessionID).
			Delete(&domain.Session{}).Error
	})
	return err
}

// SoftDelete soft-deletes a session by setting deleted_at
func (r *SessionRepository) SoftDelete(ctx context.Context, sessionID int64) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).
			Model(&domain.Session{}).
			Where("id = ?", sessionID).
			Update("deleted_at", time.Now()).Error
	})
	return err
}

// SoftDeleteByUserID soft-deletes all sessions for a user
func (r *SessionRepository) SoftDeleteByUserID(ctx context.Context, userID int64) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).
			Model(&domain.Session{}).
			Where("user_id = ?", userID).
			Update("deleted_at", time.Now()).Error
	})
	return err
}

// DeleteExpiredAndSoftDeleted physically deletes expired and soft-deleted sessions
func (r *SessionRepository) DeleteExpiredAndSoftDeleted(ctx context.Context) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).
			Where("expires_at < ? OR deleted_at IS NOT NULL", time.Now()).
			Delete(&domain.Session{}).Error
	})
	return err
}

// IsTokenValid checks if a token is valid (exists, not expired, and not soft-deleted)
func (r *SessionRepository) IsTokenValid(ctx context.Context, tokenHash string) (bool, int64, error) {
	type tokenResult struct {
		valid  bool
		userID int64
	}
	res, err := r.cb.Execute(func() (any, error) {
		var session domain.Session
		err := r.db.WithContext(ctx).
			Where("token_hash = ? AND expires_at > ? AND deleted_at IS NULL", tokenHash, time.Now()).
			First(&session).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return tokenResult{false, 0}, nil
			}
			return nil, err
		}
		return tokenResult{true, session.UserID}, nil
	})

	if err != nil {
		return false, 0, &gtk.InternalError{Message: "failed to validate token", Err: err}
	}

	r2 := res.(tokenResult)
	return r2.valid, r2.userID, nil
}

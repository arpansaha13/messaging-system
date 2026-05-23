package worker

import (
	"context"
	"time"

	"go.uber.org/zap"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/repository"
)

// CleanupWorker handles periodic cleanup tasks
type CleanupWorker struct {
	sessionRepo *repository.SessionRepository
	otpRepo     *repository.OTPRepository
	interval    time.Duration
	stopChan    chan bool
}

// NewCleanupWorker creates a new cleanup worker
func NewCleanupWorker(
	sessionRepo *repository.SessionRepository,
	otpRepo *repository.OTPRepository,
	interval time.Duration,
) *CleanupWorker {
	return &CleanupWorker{
		sessionRepo: sessionRepo,
		otpRepo:     otpRepo,
		interval:    interval,
		stopChan:    make(chan bool),
	}
}

// Start starts the cleanup worker
func (w *CleanupWorker) Start() {
	zap.L().Info("starting cleanup worker", zap.Duration("interval", w.interval))

	go func() {
		ticker := time.NewTicker(w.interval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				w.cleanup()
			case <-w.stopChan:
				zap.L().Info("stopping cleanup worker")
				return
			}
		}
	}()
}

// Stop stops the cleanup worker
func (w *CleanupWorker) Stop() {
	w.stopChan <- true
}

// cleanup removes expired sessions and OTPs
func (w *CleanupWorker) cleanup() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Clean up expired sessions
	if err := w.sessionRepo.DeleteExpiredAndSoftDeleted(ctx); err != nil {
		zap.L().Error("failed to delete expired sessions", zap.Error(err))
	} else {
		zap.L().Info("expired sessions cleaned up")
	}

	// Clean up expired OTPs
	if err := w.otpRepo.DeleteExpiredAndSoftDeleted(ctx); err != nil {
		zap.L().Error("failed to delete expired otps", zap.Error(err))
	} else {
		zap.L().Info("expired otps cleaned up")
	}
}

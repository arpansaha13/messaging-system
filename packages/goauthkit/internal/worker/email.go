package worker

import (
	"context"
	"sync"

	"go.uber.org/zap"
)

// EmailTask represents an email task to be sent
type EmailTask struct {
	Recipient string
	Subject   string
	Body      string
}

// EmailWorkerPool manages a pool of email worker goroutines with a buffered channel
type EmailWorkerPool struct {
	taskQueue     chan EmailTask
	emailProvider EmailProvider
	wg            sync.WaitGroup
	ctx           context.Context
	cancel        context.CancelFunc
}

// EmailProvider interface for sending emails
type EmailProvider interface {
	SendEmail(ctx context.Context, email, subject, body string) error
}

// NewEmailWorkerPool creates a new email worker pool
func NewEmailWorkerPool(workerCount int, queueSize int, emailProvider EmailProvider) *EmailWorkerPool {
	ctx, cancel := context.WithCancel(context.Background())

	pool := &EmailWorkerPool{
		taskQueue:     make(chan EmailTask, queueSize),
		emailProvider: emailProvider,
		ctx:           ctx,
		cancel:        cancel,
	}

	// Start worker goroutines
	for i := 0; i < workerCount; i++ {
		pool.wg.Add(1)
		go pool.worker(i)
	}

	zap.L().Info("email worker pool started", zap.Int("workers", workerCount))
	return pool
}

// Stop gracefully stops the worker pool
func (p *EmailWorkerPool) Stop() {
	zap.L().Info("stopping email worker pool")
	p.cancel()
	close(p.taskQueue)
	p.wg.Wait()
	zap.L().Info("email worker pool stopped")
}

// Enqueue adds a task to the queue (non-blocking, will log if pool is shutting down)
func (p *EmailWorkerPool) Enqueue(task EmailTask) {
	select {
	case p.taskQueue <- task:
		// Task enqueued successfully
	case <-p.ctx.Done():
		zap.L().Warn("worker pool is shutting down, discarding task")
	}
}

// Private helper methods

func (p *EmailWorkerPool) worker(id int) {
	defer p.wg.Done()

	zap.L().Info("email worker started", zap.Int("worker_id", id))

	for {
		select {
		case task, ok := <-p.taskQueue:
			if !ok {
				zap.L().Info("email worker stopped", zap.Int("worker_id", id))
				return
			}

			p.handleTask(id, task)

		case <-p.ctx.Done():
			zap.L().Info("email worker shutting down", zap.Int("worker_id", id))
			return
		}
	}
}

func (p *EmailWorkerPool) handleTask(workerID int, task EmailTask) {
	err := p.emailProvider.SendEmail(p.ctx, task.Recipient, task.Subject, task.Body)
	if err != nil {
		zap.L().Error("failed to send email", zap.Int("worker_id", workerID), zap.String("recipient", task.Recipient), zap.Error(err))
		return
	}

	zap.L().Info("email sent", zap.Int("worker_id", workerID), zap.String("recipient", task.Recipient))
}

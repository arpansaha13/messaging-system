package circuits

import (
	"errors"

	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// Circuits holds circuit breaker instances for all external dependencies.
type Circuits struct {
	Postgres *gobreaker.CircuitBreaker[any]
	RabbitMQ *gobreaker.CircuitBreaker[any]
}

// New creates and returns a new Circuits instance with initialized circuit breakers
// for Postgres and RabbitMQ.
func New(logger *zap.Logger) *Circuits {
	return &Circuits{
		Postgres: newPostgresCB(logger),
		RabbitMQ: newRabbitMQCB(logger),
	}
}

// newPostgresCB creates a circuit breaker for Postgres database calls.
// IsSuccessful filters out gorm.ErrRecordNotFound as it's a logical error, not an infrastructure failure.
func newPostgresCB(logger *zap.Logger) *gobreaker.CircuitBreaker[any] {
	return gobreaker.NewCircuitBreaker[any](gobreaker.Settings{
		Name: "postgres",
		IsSuccessful: func(err error) bool {
			if err == nil {
				return true
			}
			// Record not found is a logical error, not an infrastructure failure
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return true
			}
			return false
		},
		OnStateChange: func(name string, from, to gobreaker.State) {
			logger.Warn("circuit breaker state changed",
				zap.String("name", name),
				zap.String("from", from.String()),
				zap.String("to", to.String()),
			)
		},
	})
}

// newRabbitMQCB creates a circuit breaker for RabbitMQ publish operations.
func newRabbitMQCB(logger *zap.Logger) *gobreaker.CircuitBreaker[any] {
	return gobreaker.NewCircuitBreaker[any](gobreaker.Settings{
		Name: "rabbitmq",
		OnStateChange: func(name string, from, to gobreaker.State) {
			logger.Warn("circuit breaker state changed",
				zap.String("name", name),
				zap.String("from", from.String()),
				zap.String("to", to.String()),
			)
		},
	})
}

package circuits

import (
	"errors"

	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// Circuits holds all circuit breakers for the auth service
type Circuits struct {
	Postgres *gobreaker.CircuitBreaker[any]
	Cache    *gobreaker.CircuitBreaker[any]
}

// New creates a new circuits instance with all circuit breakers initialized
func New(logger *zap.Logger) *Circuits {
	return &Circuits{
		Postgres: newPostgresCB(logger),
		Cache:    newCacheCB(logger),
	}
}

// newPostgresCB creates a circuit breaker for Postgres database operations
func newPostgresCB(l *zap.Logger) *gobreaker.CircuitBreaker[any] {
	return gobreaker.NewCircuitBreaker[any](gobreaker.Settings{
		Name: "auth-postgres",
		OnStateChange: func(name string, from, to gobreaker.State) {
			l.Warn("circuit breaker state changed",
				zap.String("name", name),
				zap.String("from", from.String()),
				zap.String("to", to.String()),
			)
		},
		IsSuccessful: func(err error) bool {
			if err == nil {
				return true
			}
			// Exclude record-not-found as it's a logical error, not an infrastructure failure
			return errors.Is(err, gorm.ErrRecordNotFound)
		},
	})
}

// newCacheCB creates a circuit breaker for memcached cache operations
func newCacheCB(l *zap.Logger) *gobreaker.CircuitBreaker[any] {
	return gobreaker.NewCircuitBreaker[any](gobreaker.Settings{
		Name: "auth-cache",
		OnStateChange: func(name string, from, to gobreaker.State) {
			l.Warn("circuit breaker state changed",
				zap.String("name", name),
				zap.String("from", from.String()),
				zap.String("to", to.String()),
			)
		},
		IsSuccessful: func(err error) bool {
			if err == nil {
				return true
			}
			// Cache miss is not a failure - it's expected behavior
			// Only real errors (network, timeout) should open the breaker
			return false
		},
	})
}

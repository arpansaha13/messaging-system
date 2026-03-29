package circuits

import (
	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
)

// Circuits holds circuit breaker instances for external dependencies.
type Circuits struct {
	AuthGRPC *gobreaker.CircuitBreaker[any]
}

// New creates a Circuits instance with an AuthGRPC circuit breaker.
func New(logger *zap.Logger) *Circuits {
	return &Circuits{
		AuthGRPC: newCB("auth-grpc", logger),
	}
}

func newCB(name string, logger *zap.Logger) *gobreaker.CircuitBreaker[any] {
	return gobreaker.NewCircuitBreaker[any](gobreaker.Settings{
		Name: name,
		OnStateChange: func(name string, from, to gobreaker.State) {
			logger.Warn("circuit breaker state changed",
				zap.String("name", name),
				zap.String("from", from.String()),
				zap.String("to", to.String()),
			)
		},
	})
}

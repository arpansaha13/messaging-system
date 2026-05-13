package circuits

import (
	"time"

	"github.com/sony/gobreaker/v2"
)

// Circuits holds all circuit breakers for the application.
type Circuits struct {
	Postgres    *gobreaker.CircuitBreaker[any]
	AuthService *gobreaker.CircuitBreaker[any]
}

// NewCircuits initializes all circuit breakers.
func NewCircuits() *Circuits {
	return &Circuits{
		Postgres: gobreaker.NewCircuitBreaker[any](gobreaker.Settings{
			Name:        "postgres",
			MaxRequests: 5,
			Interval:    10 * time.Second,
			Timeout:     30 * time.Second,
		}),
		AuthService: gobreaker.NewCircuitBreaker[any](gobreaker.Settings{
			Name:        "auth-service",
			MaxRequests: 5,
			Interval:    10 * time.Second,
			Timeout:     30 * time.Second,
		}),
	}
}

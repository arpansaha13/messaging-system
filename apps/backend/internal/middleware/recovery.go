package middleware

import (
	"encoding/json"
	"log"
	"net/http"
)

// RecoveryMiddleware is a minimal recovery middleware that catches any
// remaining uncaught panics and returns a generic 500 error response.
// It should be the outermost middleware in the chain.
func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				// Log the panic for debugging
				log.Printf("panic recovered by RecoveryMiddleware: %v, type: %T", rec, rec)

				// Return generic error response
				w.WriteHeader(http.StatusInternalServerError)
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(ErrorResponse{
					Message: "Something went wrong!",
					Code:    "INTERNAL_ERROR",
				})
			}
		}()

		next.ServeHTTP(w, r)
	})
}

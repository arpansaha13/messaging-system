package middleware

import (
	"log"
	"net/http"
	"time"
)

// LoggingMiddleware logs HTTP requests
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Log request
		log.Printf("%s %s %s", r.Method, r.RequestURI, r.RemoteAddr)

		next.ServeHTTP(w, r)

		// Log response time
		log.Printf("Completed in %v", time.Since(start))
	})
}

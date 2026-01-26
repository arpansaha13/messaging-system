package middleware

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
)

// ErrorResponse is the standard error response format
type ErrorResponse struct {
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

// ErrorMiddleware converts domain errors to HTTP responses
func ErrorMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Store the original response writer to intercept status codes
		next.ServeHTTP(w, r)
	})
}

// WriteError writes an error response to the client
func WriteError(w http.ResponseWriter, err error) {
	statusCode, message, code := errorToHTTP(err)
	w.WriteHeader(statusCode)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ErrorResponse{
		Message: message,
		Code:    code,
	})
}

// errorToHTTP translates domain errors to HTTP status codes
func errorToHTTP(err error) (int, string, string) {
	if err == nil {
		return http.StatusOK, "", ""
	}

	log.Printf("error: %v, type: %T", err, err)

	if domain.IsValidation(err) {
		return http.StatusBadRequest, err.Error(), "VALIDATION_ERROR"
	}

	if domain.IsConflict(err) {
		return http.StatusConflict, err.Error(), "CONFLICT_ERROR"
	}

	if domain.IsNotFound(err) {
		return http.StatusNotFound, err.Error(), "NOT_FOUND_ERROR"
	}

	if domain.IsUnauthorized(err) {
		return http.StatusUnauthorized, err.Error(), "UNAUTHORIZED_ERROR"
	}

	if domain.IsForbidden(err) {
		return http.StatusForbidden, err.Error(), "FORBIDDEN_ERROR"
	}

	// Default to internal error
	return http.StatusInternalServerError, fmt.Sprintf("internal server error: %v", err), "INTERNAL_ERROR"
}

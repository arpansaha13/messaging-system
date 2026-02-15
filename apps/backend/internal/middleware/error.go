package middleware

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// ErrorResponse is the standard error response format
type ErrorResponse struct {
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

// ErrorMiddleware recovers from panics (thrown by AdaptController) and converts
// domain errors to HTTP responses. It should be placed after RecoveryMiddleware
// and LoggingMiddleware in the middleware chain.
func ErrorMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				// Check if the panic value is an error
				err, ok := rec.(error)
				if !ok {
					// Non-error panic - treat as internal server error
					lgr := logger.FromContext(r.Context())
					lgr.Error("panic recovered (non-error)",
						zap.Any("panic_value", rec),
					)
					writeErrorResponse(w, http.StatusInternalServerError, "Something went wrong!", "INTERNAL_ERROR")
					return
				}

				// Unwrap the error to get the actual underlying error
				unwrappedErr := errors.Unwrap(err)
				if unwrappedErr == nil {
					unwrappedErr = err
				}

				// Log the full error details for debugging
				lgr := logger.FromContext(r.Context())
				lgr.Error("error recovered",
					zap.Error(err),
					zap.Error(unwrappedErr),
				)

				// Map error to HTTP response
				statusCode, message, code := errorToHTTP(unwrappedErr)
				writeErrorResponse(w, statusCode, message, code)
			}
		}()

		next.ServeHTTP(w, r)
	})
}

// WriteErrorWithContext writes an error response with logging to the client
func WriteErrorWithContext(w http.ResponseWriter, ctx context.Context, err error) {
	lgr := logger.FromContext(ctx)
	statusCode, message, code := errorToHTTP(err)
	lgr.Info("error response", zap.String("code", code), zap.Int("status", statusCode), zap.Error(err))
	writeErrorResponse(w, statusCode, message, code)
}

// writeErrorResponse writes an error response to the client
func writeErrorResponse(w http.ResponseWriter, statusCode int, message, code string) {
	w.WriteHeader(statusCode)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ErrorResponse{
		Message: message,
		Code:    code,
	})
}

// errorToHTTP translates domain errors to HTTP status codes
// For 500 errors, it returns a generic message while logging the actual error
func errorToHTTP(err error) (int, string, string) {
	if err == nil {
		return http.StatusOK, "", ""
	}

	// Unwrap InternalError to get the underlying error for logging
	var internalErr *domain.InternalError
	if errors.As(err, &internalErr) && internalErr.Err != nil {
		log.Printf("internal error: %v, underlying: %v", err, internalErr.Err)
	}

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

	// Default to internal error with generic message
	// The actual error details are logged above
	return http.StatusInternalServerError, "Something went wrong!", "INTERNAL_ERROR"
}

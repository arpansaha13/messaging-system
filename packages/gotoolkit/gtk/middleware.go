package gtk

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/internal/logger"
)

// ErrorResponse is the standard error response format
type ErrorResponse struct {
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

// ControllerResponse represents a successful HTTP response
// StatusCode defaults to 200 if not set or set to 0.
// Body is the response data to be JSON-encoded.
type ControllerResponse struct {
	StatusCode int               `json:"-"`
	Body       any               `json:"-"`
	Headers    map[string]string `json:"-"`
}

// ControllerFunc is the common signature for all HTTP controllers.
// Controllers return a response object and an error.
// Controllers MUST NOT write anything to the ResponseWriter.
// On error, they return an error value which will be handled centrally.
// On success, they return a ControllerResponse with the desired status code and body.
type ControllerFunc func(w http.ResponseWriter, r *http.Request) (*ControllerResponse, error)

// HttpControllerAdaptor converts a ControllerFunc into a standard http.HandlerFunc.
// It calls the controller and handles the response:
// - On error, it panics with the error (to be handled by HttpErrorMiddleware)
// - On success, it writes the response to ResponseWriter with proper status code
// - It adds an X-Trace-ID header if a trace ID is found in the span context
func HttpControllerAdaptor(c ControllerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp, err := c(w, r)
		if err != nil {
			panic(err)
		}

		// Set headers
		for k, v := range resp.Headers {
			w.Header().Set(k, v)
		}

		// Set content type if not already set
		if w.Header().Get("Content-Type") == "" {
			w.Header().Set("Content-Type", "application/json")
		}

		// Set status code (default to 200 if not specified or 0)
		statusCode := resp.StatusCode
		if statusCode == 0 {
			statusCode = http.StatusOK
		}
		w.WriteHeader(statusCode)

		// Encode response body
		json.NewEncoder(w).Encode(resp.Body)
	}
}

// =======================================================
// ============== HTTP Middleware Functions ==============
// =======================================================

// HttpTraceMiddleware extracts the OpenTelemetry trace ID from the request context
// and sets it in the response headers as X-Trace-ID.
// It should be registered early in the middleware chain (after otelhttp).
func HttpTraceMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		span := trace.SpanFromContext(r.Context())
		if span != nil && span.SpanContext().IsValid() {
			w.Header().Set("X-Trace-ID", span.SpanContext().TraceID().String())
		}
		next.ServeHTTP(w, r)
	})
}

// HttpRecoveryMiddleware is a minimal recovery middleware that catches any
// uncaught panics and returns a generic 500 error response.
// It should be the outermost middleware in the chain.
func HttpRecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				// Log the panic for debugging
				log.Printf("panic recovered by HttpRecoveryMiddleware: %v, type: %T", rec, rec)

				// Return generic error response
				writeErrorResponse(w, r, http.StatusInternalServerError, "Something went wrong!", "INTERNAL_ERROR")
			}
		}()

		next.ServeHTTP(w, r)
	})
}

// HttpErrorMiddleware recovers from panics thrown by handlers and converts
// domain errors to HTTP responses. It should be placed after HttpRecoveryMiddleware
// and LoggingMiddleware in the middleware chain.
func HttpErrorMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				// Check if the panic value is an error
				err, ok := rec.(error)
				if !ok {
					// Non-error panic - treat as internal server error
					lgr := logger.LoggerFromContext(r.Context())
					lgr.Error("panic recovered (non-error)",
						zap.Any("panic_value", rec),
					)
					writeErrorResponse(w, r, http.StatusInternalServerError, "Something went wrong!", "INTERNAL_ERROR")
					return
				}

				// Unwrap the error to get the actual underlying error
				unwrappedErr := errors.Unwrap(err)
				if unwrappedErr == nil {
					unwrappedErr = err
				}

				// Log the full error details for debugging
				lgr := logger.LoggerFromContext(r.Context())
				lgr.Error("error recovered",
					zap.Error(err),
					zap.Error(unwrappedErr),
				)

				// Map error to HTTP response
				statusCode, message, code := errorToHTTP(unwrappedErr)
				writeErrorResponse(w, r, statusCode, message, code)
			}
		}()

		next.ServeHTTP(w, r)
	})
}

// HttpWriteErrorWithContext writes an error response with logging to the client
func HttpWriteErrorWithContext(w http.ResponseWriter, r *http.Request, err error) {
	lgr := logger.LoggerFromContext(r.Context())
	statusCode, message, code := errorToHTTP(err)
	lgr.Info("error response", zap.String("code", code), zap.Int("status", statusCode), zap.Error(err))
	writeErrorResponse(w, r, statusCode, message, code)
}

// writeErrorResponse writes an error response to the client.
// It sets the Content-Type and status code
// before writing the body. Headers must be set before WriteHeader is called.
func writeErrorResponse(w http.ResponseWriter, r *http.Request, statusCode int, message, code string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(ErrorResponse{
		Message: message,
		Code:    code,
	})
}

// errorToHTTP translates domain errors to HTTP status codes.
// For 500 errors, it returns a generic message while logging the actual error.
func errorToHTTP(err error) (int, string, string) {
	if err == nil {
		return http.StatusOK, "", ""
	}

	// Unwrap InternalError to get the underlying error for logging
	var internalErr *InternalError
	if errors.As(err, &internalErr) && internalErr.Err != nil {
		log.Printf("internal error: %v, underlying: %v", err, internalErr.Err)
	}

	if IsValidation(err) {
		return http.StatusBadRequest, err.Error(), "VALIDATION_ERROR"
	}

	if IsConflict(err) {
		return http.StatusConflict, err.Error(), "CONFLICT_ERROR"
	}

	if IsNotFound(err) {
		return http.StatusNotFound, err.Error(), "NOT_FOUND_ERROR"
	}

	if IsUnauthorized(err) {
		return http.StatusUnauthorized, err.Error(), "UNAUTHORIZED_ERROR"
	}

	if IsForbidden(err) {
		return http.StatusForbidden, err.Error(), "FORBIDDEN_ERROR"
	}

	if IsServiceUnavailable(err) {
		return http.StatusServiceUnavailable, err.Error(), "SERVICE_UNAVAILABLE_ERROR"
	}

	// Default to internal error with generic message
	// The actual error details are logged above
	return http.StatusInternalServerError, "Something went wrong!", "INTERNAL_ERROR"
}

// =======================================================
// ============= gRPC Interceptor Functions ==============
// =======================================================

// GrpcRecoveryInterceptor recovers from panics in gRPC handlers
func GrpcRecoveryInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
		defer func() {
			if r := recover(); r != nil {
				lgr := logger.LoggerFromContext(ctx)
				lgr.Error("panic recovered", zap.Any("panic_value", r), zap.String("method", info.FullMethod))
				err = status.Error(codes.Internal, "internal server error")
			}
		}()

		return handler(ctx, req)
	}
}

// GrpcErrorInterceptor is a middleware that catches errors and translates domain errors to gRPC status codes
func GrpcErrorInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		resp, err := handler(ctx, req)

		if err != nil {
			lgr := logger.LoggerFromContext(ctx)
			lgr.Error("grpc error", zap.String("method", info.FullMethod), zap.Error(err))
			return nil, errorToGRPCError(err)
		}

		return resp, nil
	}
}

// errorToGRPCError translates domain errors to gRPC status codes
func errorToGRPCError(err error) error {
	if err == nil {
		return nil
	}

	// Check error types and map to appropriate gRPC codes
	if IsValidation(err) {
		return status.Error(codes.InvalidArgument, err.Error())
	}

	if IsConflict(err) {
		return status.Error(codes.AlreadyExists, err.Error())
	}

	if IsNotFound(err) {
		return status.Error(codes.NotFound, err.Error())
	}

	if IsUnauthorized(err) {
		return status.Error(codes.Unauthenticated, err.Error())
	}

	if IsForbidden(err) {
		return status.Error(codes.PermissionDenied, err.Error())
	}

	if IsServiceUnavailable(err) {
		return status.Error(codes.Unavailable, err.Error())
	}

	// Default to internal error
	return status.Error(codes.Internal, fmt.Sprintf("internal server error: %v", err))
}

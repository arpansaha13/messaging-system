package middleware

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/domain"
)

func TestErrorMiddleware_ValidationError(t *testing.T) {
	// Create a handler that panics with a ValidationError
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic(&domain.ValidationError{Message: "test validation error"})
	})

	middleware := ErrorMiddleware(handler)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	middleware.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Equal(t, "application/json", w.Header().Get("Content-Type"))

	var resp ErrorResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, "validation error: test validation error", resp.Message)
	assert.Equal(t, "VALIDATION_ERROR", resp.Code)
}

func TestErrorMiddleware_NotFoundError(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic(&domain.NotFoundError{Message: "resource not found"})
	})

	middleware := ErrorMiddleware(handler)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	middleware.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var resp ErrorResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, "not found: resource not found", resp.Message)
	assert.Equal(t, "NOT_FOUND_ERROR", resp.Code)
}

func TestErrorMiddleware_UnauthorizedError(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic(&domain.UnauthorizedError{Message: "unauthorized access"})
	})

	middleware := ErrorMiddleware(handler)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	middleware.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var resp ErrorResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, "unauthorized: unauthorized access", resp.Message)
	assert.Equal(t, "UNAUTHORIZED_ERROR", resp.Code)
}

func TestErrorMiddleware_ConflictError(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic(&domain.ConflictError{Message: "resource conflict"})
	})

	middleware := ErrorMiddleware(handler)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	middleware.ServeHTTP(w, req)

	assert.Equal(t, http.StatusConflict, w.Code)

	var resp ErrorResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, "conflict: resource conflict", resp.Message)
	assert.Equal(t, "CONFLICT_ERROR", resp.Code)
}

func TestErrorMiddleware_ForbiddenError(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic(&domain.ForbiddenError{Message: "access forbidden"})
	})

	middleware := ErrorMiddleware(handler)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	middleware.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)

	var resp ErrorResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, "forbidden: access forbidden", resp.Message)
	assert.Equal(t, "FORBIDDEN_ERROR", resp.Code)
}

func TestErrorMiddleware_UnknownError(t *testing.T) {
	// Create a handler that panics with a non-domain error
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("some random panic value")
	})

	middleware := ErrorMiddleware(handler)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	middleware.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp ErrorResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, "Something went wrong!", resp.Message)
	assert.Equal(t, "INTERNAL_ERROR", resp.Code)
}

func TestErrorMiddleware_NonErrorPanic(t *testing.T) {
	// Create a handler that panics with a non-error value (string)
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("string panic")
	})

	middleware := ErrorMiddleware(handler)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	middleware.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp ErrorResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, "Something went wrong!", resp.Message)
	assert.Equal(t, "INTERNAL_ERROR", resp.Code)
}

func TestErrorMiddleware_InternalError(t *testing.T) {
	// Create a handler that panics with an InternalError
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic(&domain.InternalError{Message: "internal error occurred", Err: errors.New("underlying error")})
	})

	middleware := ErrorMiddleware(handler)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	middleware.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp ErrorResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, "Something went wrong!", resp.Message)
	assert.Equal(t, "INTERNAL_ERROR", resp.Code)
}

func TestErrorMiddleware_NoPanic(t *testing.T) {
	// Create a handler that doesn't panic
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("success"))
	})

	middleware := ErrorMiddleware(handler)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	middleware.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "success", w.Body.String())
}

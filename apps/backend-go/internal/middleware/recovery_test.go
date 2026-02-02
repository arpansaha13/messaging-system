package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRecoveryMiddleware_StringPanic(t *testing.T) {
	// Create a handler that panics with a string
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("string panic value")
	})

	middleware := RecoveryMiddleware(handler)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	middleware.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	assert.Equal(t, "application/json", w.Header().Get("Content-Type"))

	var resp ErrorResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, "Something went wrong!", resp.Message)
	assert.Equal(t, "INTERNAL_ERROR", resp.Code)
}

func TestRecoveryMiddleware_IntPanic(t *testing.T) {
	// Create a handler that panics with an int
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic(42)
	})

	middleware := RecoveryMiddleware(handler)

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

func TestRecoveryMiddleware_NoPanic(t *testing.T) {
	// Create a handler that doesn't panic
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("success"))
	})

	middleware := RecoveryMiddleware(handler)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	middleware.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "success", w.Body.String())
}

package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/service"
)

// NewAuthMiddleware returns a middleware that validates session tokens
func NewAuthMiddleware(authService service.IAuthService, cookieName string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var token string

			// 1. Try Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.Split(authHeader, " ")
				if len(parts) == 2 && parts[0] == "Bearer" {
					token = parts[1]
				}
			}

			// 2. Try cookie
			if token == "" {
				cookie, err := r.Cookie(cookieName)
				if err == nil {
					token = cookie.Value
				}
			}

			if token == "" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"message":"unauthenticated"}`))
				return
			}

			// Validate session
			resp, err := authService.ValidateSession(r.Context(), service.ValidateSessionRequest{Token: token})
			if err != nil || !resp.Valid {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"message":"unauthenticated"}`))
				return
			}

			// Put token and user_id in context
			ctx := context.WithValue(r.Context(), "authorization", token)
			ctx = context.WithValue(ctx, "user_id", resp.UserID)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

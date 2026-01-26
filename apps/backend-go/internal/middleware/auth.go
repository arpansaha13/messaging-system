package middleware

import (
	"context"
	"log"
	"net/http"
	"strconv"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/utils"
)

const (
	userIDContextKey   = "userID"
	authUserContextKey = "authUser"
)

// AuthMiddleware validates JWT token with the auth service via gRPC and fetches user details
func AuthMiddleware(authClient *service.AuthServiceClient) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get token from Authorization header or cookie
			token := getToken(r)
			if token == "" {
				WriteError(w, &domain.UnauthorizedError{Message: "missing authorization token"})
				return
			}

			// Validate token with auth service
			resp, err := authClient.ValidateSession(r.Context(), token)
			if err != nil {
				log.Printf("failed to validate session with auth service: %v", err)
				WriteError(w, &domain.UnauthorizedError{Message: "invalid or expired token"})
				return
			}

			if !resp.Valid {
				WriteError(w, &domain.UnauthorizedError{Message: "invalid or expired token"})
				return
			}

			// Fetch user details from auth service
			userResp, err := authClient.GetUser(r.Context(), resp.UserId, token)
			if err != nil {
				log.Printf("failed to fetch user details from auth service: %v", err)
				WriteError(w, &domain.UnauthorizedError{Message: "failed to fetch user details"})
				return
			}

			if userResp.User == nil {
				log.Printf("user details not found in auth service response")
				WriteError(w, &domain.UnauthorizedError{Message: "user not found"})
				return
			}

			// Create AuthUser object with details from auth service
			authUser := &domain.AuthUser{
				UserID:   resp.UserId,
				Email:    userResp.User.Email,
				Username: userResp.User.Username,
				Verified: userResp.User.Verified,
			}

			// Add user ID, auth user, and token to context
			userIDStr := strconv.FormatInt(resp.UserId, 10)
			ctx := context.WithValue(r.Context(), userIDContextKey, userIDStr)
			ctx = context.WithValue(ctx, authUserContextKey, authUser)
			ctx = utils.SetTokenInContext(ctx, token)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserIDFromContext extracts user ID from request context
func GetUserIDFromContext(r *http.Request) string {
	userID, ok := r.Context().Value(userIDContextKey).(string)
	if !ok {
		return ""
	}
	return userID
}

// GetAuthUserFromContext extracts auth user from request context
func GetAuthUserFromContext(r *http.Request) *domain.AuthUser {
	authUser, ok := r.Context().Value(authUserContextKey).(*domain.AuthUser)
	if !ok {
		return nil
	}
	return authUser
}

// getToken extracts token from Authorization header or cookie
func getToken(r *http.Request) string {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	cookie, err := r.Cookie(cfg.AuthCookieName)
	if err == nil && cookie.Value != "" {
		return cookie.Value
	}

	return ""
}

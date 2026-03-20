package middleware

import (
	"context"
	"net/http"
	"strconv"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// AuthMiddleware validates JWT token with the auth service via gRPC and fetches user details
func AuthMiddleware(authClient service.IAuthServiceClient) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get token from Authorization header or cookie
			token := getToken(r)
			if token == "" {
				gotoolkit.HttpWriteErrorWithContext(w, r.Context(), &gotoolkit.UnauthorizedError{Message: "missing authorization token"})
				return
			}

			// Get logger from context
			lgr := logger.FromContext(r.Context())

			// Validate token with auth service
			resp, err := authClient.ValidateSession(r.Context(), token)
			if err != nil {
				lgr.Error("failed to validate session with auth service", zap.Error(err))
				gotoolkit.HttpWriteErrorWithContext(w, r.Context(), &gotoolkit.UnauthorizedError{Message: "invalid or expired token"})
				return
			}

			if !resp.Valid {
				gotoolkit.HttpWriteErrorWithContext(w, r.Context(), &gotoolkit.UnauthorizedError{Message: "invalid or expired token"})
				return
			}

			// Fetch user details from auth service
			userResp, err := authClient.GetUser(r.Context(), resp.UserId, token)
			if err != nil {
				lgr.Error("failed to fetch user details from auth service", zap.Error(err))
				gotoolkit.HttpWriteErrorWithContext(w, r.Context(), &gotoolkit.UnauthorizedError{Message: "failed to fetch user details"})
				return
			}

			if userResp.User == nil {
				lgr.Error("user details not found in auth service response")
				gotoolkit.HttpWriteErrorWithContext(w, r.Context(), &gotoolkit.UnauthorizedError{Message: "user not found"})
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
			ctx := context.WithValue(r.Context(), utils.UserIDContextKey, userIDStr)
			ctx = context.WithValue(ctx, utils.AuthUserContextKey, authUser)
			ctx = utils.SetTokenInContext(ctx, token)

			// Add user_id to logger context
			ctx = logger.WithFields(ctx, zap.String("user_id", userIDStr))

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserIDFromContext extracts user ID from request context
func GetUserIDFromContext(r *http.Request) string {
	userID, ok := r.Context().Value(utils.UserIDContextKey).(string)
	if !ok {
		return ""
	}
	return userID
}

// GetAuthUserFromContext extracts auth user from request context
func GetAuthUserFromContext(r *http.Request) *domain.AuthUser {
	authUser, ok := r.Context().Value(utils.AuthUserContextKey).(*domain.AuthUser)
	if !ok {
		return nil
	}
	return authUser
}

// getToken extracts token from Authorization header or cookie
func getToken(r *http.Request) string {
	cfg, _ := config.Load()

	// First try to get token from Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		// Expected format: "Bearer <token>"
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			return authHeader[7:]
		}
	}

	// Fall back to cookie
	cookie, err := r.Cookie(cfg.AuthCookieName())
	if err == nil && cookie.Value != "" {
		return cookie.Value
	}

	return ""
}

package middleware

import (
	"context"
	"log"
	"net/http"
	"strconv"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/config"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/service"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/utils"
)

const (
	UserIDContextKey   = "userID"
	AuthUserContextKey = "authUser"
)

// AuthMiddleware validates the session token via the auth gRPC service and
// populates the request context with the authenticated user's details.
func AuthMiddleware(authClient service.IAuthServiceClient) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := getToken(r)
			if token == "" {
				gotoolkit.HttpWriteErrorWithContext(w, r, &gotoolkit.UnauthorizedError{Message: "missing authorization token"})
				return
			}

			lgr := logger.FromContext(r.Context())

			resp, err := authClient.ValidateSession(r.Context(), token)
			if err != nil {
				lgr.Error("failed to validate session with auth service", zap.Error(err))
				gotoolkit.HttpWriteErrorWithContext(w, r, &gotoolkit.UnauthorizedError{Message: "invalid or expired token"})
				return
			}

			if !resp.Valid {
				gotoolkit.HttpWriteErrorWithContext(w, r, &gotoolkit.UnauthorizedError{Message: "invalid or expired token"})
				return
			}

			userResp, err := authClient.GetUser(r.Context(), resp.UserId, token)
			if err != nil {
				lgr.Error("failed to fetch user details from auth service", zap.Error(err))
				gotoolkit.HttpWriteErrorWithContext(w, r, &gotoolkit.UnauthorizedError{Message: "failed to fetch user details"})
				return
			}

			if userResp.User == nil {
				lgr.Error("user details not found in auth service response")
				gotoolkit.HttpWriteErrorWithContext(w, r, &gotoolkit.UnauthorizedError{Message: "user not found"})
				return
			}

			authUser := &domain.AuthUser{
				UserID:   resp.UserId,
				Email:    userResp.User.Email,
				Username: userResp.User.Username,
				Verified: userResp.User.Verified,
			}

			userIDStr := strconv.FormatInt(resp.UserId, 10)
			ctx := context.WithValue(r.Context(), UserIDContextKey, userIDStr)
			ctx = context.WithValue(ctx, AuthUserContextKey, authUser)
			ctx = utils.SetTokenInContext(ctx, token)
			ctx = logger.WithFields(ctx, zap.String("user_id", userIDStr))

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserIDFromContext extracts the user ID string from the request context.
func GetUserIDFromContext(r *http.Request) string {
	userID, ok := r.Context().Value(UserIDContextKey).(string)
	if !ok {
		return ""
	}
	return userID
}

// GetAuthUserFromContext extracts the AuthUser from the request context.
func GetAuthUserFromContext(r *http.Request) *domain.AuthUser {
	authUser, ok := r.Context().Value(AuthUserContextKey).(*domain.AuthUser)
	if !ok {
		return nil
	}
	return authUser
}

// getToken extracts the bearer token from the Authorization header or the auth cookie.
func getToken(r *http.Request) string {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			return authHeader[7:]
		}
	}

	cookie, err := r.Cookie(cfg.AuthCookieName)
	if err == nil && cookie.Value != "" {
		return cookie.Value
	}

	return ""
}

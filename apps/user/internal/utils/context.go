package utils

import (
	"context"
	"strconv"

	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

const (
	UserIDContextKey   = "userID"
	AuthUserContextKey = "authUser"
	TokenContextKey    = "token"
)

// GetUserIDFromCtx extracts the authenticated user ID from the context.
func GetUserIDFromCtx(ctx context.Context) int64 {
	userIDStr, ok := ctx.Value(UserIDContextKey).(string)
	if !ok {
		return 0
	}
	userID, _ := strconv.ParseInt(userIDStr, 10, 64)
	return userID
}

// GetAuthUserFromCtx extracts the authenticated user from the context.
func GetAuthUserFromCtx(ctx context.Context) *domain.AuthUser {
	authUser, ok := ctx.Value(AuthUserContextKey).(*domain.AuthUser)
	if !ok {
		return nil
	}
	return authUser
}

// SetTokenInContext adds a token to the context.
func SetTokenInContext(ctx context.Context, token string) context.Context {
	return context.WithValue(ctx, TokenContextKey, token)
}

// GetTokenFromContext extracts a token from the context.
func GetTokenFromContext(ctx context.Context) string {
	token, ok := ctx.Value(TokenContextKey).(string)
	if !ok {
		return ""
	}
	return token
}

package utils

import (
	"context"
	"strconv"

	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

const (
	UserIDContextKey   = "userID"
	AuthUserContextKey = "authUser"
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

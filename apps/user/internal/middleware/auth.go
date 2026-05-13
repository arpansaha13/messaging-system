package middleware

import (
	"context"
	"net/http"
	"strconv"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/arpansaha13/messaging-system/apps/user/internal/config"
	"github.com/arpansaha13/messaging-system/apps/user/internal/service"
	"github.com/arpansaha13/messaging-system/apps/user/internal/utils"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// AuthMiddleware validates JWT token with the auth service via gRPC and fetches user details.
func AuthMiddleware(authClient service.IAuthServiceClient) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := getToken(r)
			if token == "" {
				gtk.HttpWriteErrorWithContext(w, r, &gtk.UnauthorizedError{Message: "missing authorization token"})
				return
			}

			lgr := gtk.LoggerFromContext(r.Context())

			resp, err := authClient.ValidateSession(r.Context(), token)
			if err != nil {
				lgr.Error("failed to validate session with auth service", zap.Error(err))
				st, ok := status.FromError(err)
				if ok && st.Code() == codes.Unauthenticated {
					gtk.HttpWriteErrorWithContext(w, r, &gtk.UnauthorizedError{Message: "invalid or expired token"})
				} else {
					gtk.HttpWriteErrorWithContext(w, r, &gtk.ServiceUnavailableError{Message: "auth service unavailable"})
				}
				return
			}

			if !resp.Valid {
				gtk.HttpWriteErrorWithContext(w, r, &gtk.UnauthorizedError{Message: "invalid or expired token"})
				return
			}

			userResp, err := authClient.GetUser(r.Context(), resp.UserId, token)
			if err != nil {
				lgr.Error("failed to fetch user details from auth service", zap.Error(err))
				st, ok := status.FromError(err)
				if ok && st.Code() == codes.Unauthenticated {
					gtk.HttpWriteErrorWithContext(w, r, &gtk.UnauthorizedError{Message: "invalid or expired token"})
				} else {
					gtk.HttpWriteErrorWithContext(w, r, &gtk.ServiceUnavailableError{Message: "auth service unavailable"})
				}
				return
			}

			if userResp.User == nil {
				gtk.HttpWriteErrorWithContext(w, r, &gtk.UnauthorizedError{Message: "user not found"})
				return
			}

			authUser := &domain.AuthUser{
				UserID:   resp.UserId,
				Email:    userResp.User.Email,
				Username: userResp.User.Username,
				Verified: userResp.User.Verified,
			}

			userIDStr := strconv.FormatInt(resp.UserId, 10)
			ctx := context.WithValue(r.Context(), utils.UserIDContextKey, userIDStr)
			ctx = context.WithValue(ctx, utils.AuthUserContextKey, authUser)
			ctx = utils.SetTokenInContext(ctx, token)
			ctx = gtk.LoggerWithFields(ctx, zap.String("user_id", userIDStr))

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetAuthUserFromContext extracts auth user from request context.
func GetAuthUserFromContext(r *http.Request) *domain.AuthUser {
	return utils.GetAuthUserFromCtx(r.Context())
}

func getToken(r *http.Request) string {
	cfg, _ := config.Load()

	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			return authHeader[7:]
		}
	}

	cookie, err := r.Cookie(cfg.AuthCookieName())
	if err == nil && cookie.Value != "" {
		return cookie.Value
	}

	return ""
}

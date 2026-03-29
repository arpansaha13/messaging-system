package utils

import (
	"context"
	"fmt"

	"google.golang.org/grpc/metadata"
)

const tokenContextKey = "auth_token"

// SetTokenInContext stores the token in the context.
func SetTokenInContext(ctx context.Context, token string) context.Context {
	return context.WithValue(ctx, tokenContextKey, token)
}

// GetTokenFromContext retrieves the token from the context.
func GetTokenFromContext(ctx context.Context) string {
	token, ok := ctx.Value(tokenContextKey).(string)
	if !ok {
		return ""
	}
	return token
}

// WithAuthMetadata attaches the token as gRPC outgoing metadata.
func WithAuthMetadata(ctx context.Context, token string) context.Context {
	if token == "" {
		return ctx
	}
	md := metadata.Pairs("authorization", fmt.Sprintf("Bearer %s", token))
	return metadata.NewOutgoingContext(ctx, md)
}

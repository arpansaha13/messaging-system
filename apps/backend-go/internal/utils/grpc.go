package utils

import (
	"context"
	"fmt"

	"google.golang.org/grpc/metadata"
)

const tokenContextKey = "auth_token"

// SetTokenInContext stores the token in the context
func SetTokenInContext(ctx context.Context, token string) context.Context {
	return context.WithValue(ctx, tokenContextKey, token)
}

// GetTokenFromContext retrieves the token from the context
func GetTokenFromContext(ctx context.Context) string {
	token, ok := ctx.Value(tokenContextKey).(string)
	if !ok {
		return ""
	}
	return token
}

// WithAuthMetadata takes a context and token, and returns a new context with
// the token added as metadata for gRPC requests to the auth service
func WithAuthMetadata(ctx context.Context, token string) context.Context {
	if token == "" {
		return ctx
	}

	md := metadata.Pairs("authorization", fmt.Sprintf("Bearer %s", token))
	return metadata.NewOutgoingContext(ctx, md)
}

// WithAuthMetadataFromContext extracts the token from the context and returns
// a new context with the token added as metadata for gRPC requests
func WithAuthMetadataFromContext(ctx context.Context) context.Context {
	token := GetTokenFromContext(ctx)
	return WithAuthMetadata(ctx, token)
}

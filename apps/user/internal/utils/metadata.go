package utils

import (
	"context"

	"google.golang.org/grpc/metadata"
)

// WithAuthMetadata adds a token to the context as gRPC metadata.
func WithAuthMetadata(ctx context.Context, token string) context.Context {
	if token == "" {
		return ctx
	}
	md := metadata.Pairs("authorization", "Bearer "+token)
	return metadata.NewOutgoingContext(ctx, md)
}

package middleware

import (
	"context"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// AuthorizationInterceptor intercepts gRPC requests to validate session tokens
func AuthorizationInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		// Skip authorization for public endpoints
		if isPublicEndpoint(info.FullMethod) {
			return handler(ctx, req)
		}

		// Extract token from metadata
		token := extractTokenFromMetadata(ctx)
		if token == "" {
			return nil, status.Error(codes.Unauthenticated, "missing or invalid authorization token")
		}

		// Add token to context
		ctx = context.WithValue(ctx, "authorization", token)

		// Continue with handler
		return handler(ctx, req)
	}
}

// Private helper functions

func extractTokenFromMetadata(ctx context.Context) string {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return ""
	}

	values := md.Get("authorization")
	if len(values) == 0 {
		return ""
	}

	// Extract bearer token
	authHeader := values[0]
	if after, ok := strings.CutPrefix(authHeader, "Bearer "); ok {
		return after
	}

	return authHeader
}

func isPublicEndpoint(fullMethod string) bool {
	publicEndpoints := map[string]bool{
		"/proto.AuthService/Signup":         true,
		"/proto.AuthService/Login":          true,
		"/proto.AuthService/VerifyOTP":      true,
		"/proto.AuthService/ForgotPassword": true,
		"/proto.AuthService/ResetPassword":  true,
	}

	return publicEndpoints[fullMethod]
}

// ChainUnaryInterceptors chains multiple unary interceptors
func ChainUnaryInterceptors(interceptors ...grpc.UnaryServerInterceptor) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		// Build chain from right to left
		for i := len(interceptors) - 1; i >= 0; i-- {
			next := handler
			currentInterceptor := interceptors[i]
			handler = func(ctx context.Context, req any) (any, error) {
				return currentInterceptor(ctx, req, info, next)
			}
		}
		return handler(ctx, req)
	}
}

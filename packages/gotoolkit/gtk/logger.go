package gtk

import (
	"context"
	"net/http"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/internal/logger"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"google.golang.org/grpc"
	gormlogger "gorm.io/gorm/logger"
)

// NewZapLogger creates a zap.Logger with JSON output to stdout.
func NewZapLogger(level zapcore.Level) (*zap.Logger, error) {
	return logger.NewZapLogger(level)
}

// LoggerFromContext returns the *zap.Logger stored in the context.
func LoggerFromContext(ctx context.Context) *zap.Logger {
	return logger.LoggerFromContext(ctx)
}

// LoggerWithContext stores a *zap.Logger in ctx.
func LoggerWithContext(ctx context.Context, l *zap.Logger) context.Context {
	return logger.LoggerWithContext(ctx, l)
}

// LoggerWithFields adds fields to the *zap.Logger stored in ctx.
func LoggerWithFields(ctx context.Context, fields ...zap.Field) context.Context {
	return logger.LoggerWithFields(ctx, fields...)
}

// HttpLoggerMiddleware returns an HTTP middleware that injects a logger into the request context.
func HttpLoggerMiddleware(l *zap.Logger) func(http.Handler) http.Handler {
	return logger.HttpMiddleware(l)
}

// GrpcLoggerInterceptor returns a gRPC unary server interceptor that logs with high observability.
func GrpcLoggerInterceptor(l *zap.Logger) grpc.UnaryServerInterceptor {
	return logger.GrpcInterceptor(l)
}

// NewGormLogger creates a GormLogger backed by l.
func NewGormLogger(l *zap.Logger, level gormlogger.LogLevel) gormlogger.Interface {
	return logger.NewGormLogger(l, level)
}

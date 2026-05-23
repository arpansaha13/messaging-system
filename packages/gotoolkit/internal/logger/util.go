package logger

import (
	"context"

	"go.uber.org/zap"
)

// contextKey is an unexported type to avoid key collisions.
type contextKey string

const loggerContextKey contextKey = "logger"

// LoggerFromContext returns the *zap.Logger stored in the context.
// If no logger is found, it returns zap.L().
func LoggerFromContext(ctx context.Context) *zap.Logger {
	if logger, ok := ctx.Value(loggerContextKey).(*zap.Logger); ok {
		return logger
	}
	return zap.L()
}

// LoggerWithContext stores a *zap.Logger in ctx for downstream retrieval via LoggerFromContext.
func LoggerWithContext(ctx context.Context, l *zap.Logger) context.Context {
	return context.WithValue(ctx, loggerContextKey, l)
}

// LoggerWithFields adds fields to the *zap.Logger stored in ctx and returns a new context.
func LoggerWithFields(ctx context.Context, fields ...zap.Field) context.Context {
	logger := LoggerFromContext(ctx)
	newLogger := logger.WithOptions(zap.Fields(fields...))
	return LoggerWithContext(ctx, newLogger)
}

package logger

import (
	"context"
	"errors"
	"time"

	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

const defaultSlowThreshold = 200 * time.Millisecond

type GormLogger struct {
	l             *zap.Logger
	level         gormlogger.LogLevel
	slowThreshold time.Duration
}

// NewGormLogger creates a GormLogger backed by l. A Warn level will log slow
// queries and errors; Info level additionally logs every query.
func NewGormLogger(l *zap.Logger, level gormlogger.LogLevel) *GormLogger {
	return &GormLogger{l: l, level: level, slowThreshold: defaultSlowThreshold}
}

func (g *GormLogger) LogMode(level gormlogger.LogLevel) gormlogger.Interface {
	copy := *g
	copy.level = level
	return &copy
}

// withSpanFields returns a zap.Logger enriched with trace_id/span_id when a
// valid OTel span is present in ctx.
func (g *GormLogger) withSpanFields(ctx context.Context) *zap.Logger {
	span := trace.SpanFromContext(ctx)
	if !span.SpanContext().IsValid() {
		return g.l
	}
	return g.l.With(
		zap.String("trace_id", span.SpanContext().TraceID().String()),
		zap.String("span_id", span.SpanContext().SpanID().String()),
	)
}

func (g *GormLogger) Info(ctx context.Context, msg string, data ...any) {
	if g.level >= gormlogger.Info {
		g.withSpanFields(ctx).Sugar().Infof(msg, data...)
	}
}

func (g *GormLogger) Warn(ctx context.Context, msg string, data ...any) {
	if g.level >= gormlogger.Warn {
		g.withSpanFields(ctx).Sugar().Warnf(msg, data...)
	}
}

func (g *GormLogger) Error(ctx context.Context, msg string, data ...any) {
	if g.level >= gormlogger.Error {
		g.withSpanFields(ctx).Sugar().Errorf(msg, data...)
	}
}

// Trace is called by GORM for every SQL operation.
// - RecordNotFound is not an error (skipped).
// - Queries exceeding slowThreshold are logged at Warn.
// - All other queries are logged at Info when level >= Info.
func (g *GormLogger) Trace(ctx context.Context, begin time.Time, fc func() (string, int64), err error) {
	if g.level <= gormlogger.Silent {
		return
	}
	elapsed := time.Since(begin)
	sql, rows := fc()
	l := g.withSpanFields(ctx)
	fields := []zap.Field{
		zap.Duration("elapsed", elapsed),
		zap.Int64("rows", rows),
		zap.String("sql", sql),
	}
	switch {
	case err != nil && !errors.Is(err, gorm.ErrRecordNotFound) && g.level >= gormlogger.Error:
		l.Error("gorm trace", append(fields, zap.Error(err))...)
	case g.slowThreshold != 0 && elapsed > g.slowThreshold && g.level >= gormlogger.Warn:
		l.Warn("gorm slow query", fields...)
	case g.level >= gormlogger.Info:
		l.Info("gorm trace", fields...)
	}
}

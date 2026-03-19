package app

import (
	"context"
	"fmt"
	"time"

	otelhost "go.opentelemetry.io/contrib/instrumentation/host"
	otelruntime "go.opentelemetry.io/contrib/instrumentation/runtime"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/exporters/prometheus"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/config"
)

// SetupTelemetry initialises the global OTel TracerProvider and MeterProvider.
//
// Tracing: if OTLP_ENDPOINT is set, traces are exported via OTLP gRPC.
// Otherwise a no-op provider is used (spans created but not exported).
//
// Metrics: OTel metrics are bridged into the default Prometheus registry so
// the existing /metrics server picks them up without additional configuration.
//
// Returns a shutdown function that flushes and closes both providers.
func SetupTelemetry(ctx context.Context, serviceName string, zapLogger *zap.Logger) (func(context.Context), error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, err
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(semconv.ServiceName(serviceName)),
	)
	if err != nil {
		return nil, fmt.Errorf("build OTel resource: %w", err)
	}

	var tp *sdktrace.TracerProvider
	if otlpEndpoint := cfg.OTLPEndpoint(); otlpEndpoint != "" {
		conn, err := grpc.NewClient(otlpEndpoint, grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err != nil {
			return nil, fmt.Errorf("connect to OTLP endpoint %s: %w", otlpEndpoint, err)
		}
		traceExporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithGRPCConn(conn))
		if err != nil {
			return nil, fmt.Errorf("create OTLP trace exporter: %w", err)
		}
		tp = sdktrace.NewTracerProvider(
			sdktrace.WithBatcher(traceExporter),
			sdktrace.WithResource(res),
		)
	} else {
		tp = sdktrace.NewTracerProvider(sdktrace.WithResource(res))
	}
	otel.SetTracerProvider(tp)

	promExporter, err := prometheus.New()
	if err != nil {
		return nil, fmt.Errorf("create Prometheus metrics exporter: %w", err)
	}
	mp := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(promExporter),
		sdkmetric.WithResource(res),
	)
	otel.SetMeterProvider(mp)

	if err := otelruntime.Start(otelruntime.WithMinimumReadMemStatsInterval(time.Second)); err != nil {
		zapLogger.Warn("failed to start Go runtime instrumentation", zap.Error(err))
	}
	if err := otelhost.Start(); err != nil {
		zapLogger.Warn("failed to start host instrumentation", zap.Error(err))
	}

	return func(ctx context.Context) {
		if err := tp.Shutdown(ctx); err != nil {
			zapLogger.Error("tracer provider shutdown error", zap.Error(err))
		}
		if err := mp.Shutdown(ctx); err != nil {
			zapLogger.Error("meter provider shutdown error", zap.Error(err))
		}
	}, nil
}

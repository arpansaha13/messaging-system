package app

import (
	"context"
	"fmt"
	"time"

	otelhost "go.opentelemetry.io/contrib/instrumentation/host"
	otelruntime "go.opentelemetry.io/contrib/instrumentation/runtime"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/prometheus"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.uber.org/zap"
)

// SetupTelemetry initialises the global OTel MeterProvider.
//
// Metrics: OTel metrics are bridged into the default Prometheus registry so
// the existing /metrics server picks them up without additional configuration.
//
// Returns a shutdown function that flushes and closes the provider.
func SetupTelemetry(ctx context.Context, serviceName string, zapLogger *zap.Logger) (func(context.Context), error) {
	res, err := resource.New(ctx,
		resource.WithAttributes(semconv.ServiceName(serviceName)),
	)
	if err != nil {
		return nil, fmt.Errorf("build OTel resource: %w", err)
	}

	// --- Meter provider — bridges OTel metrics into the default Prometheus registry ---
	promExporter, err := prometheus.New()
	if err != nil {
		return nil, fmt.Errorf("create Prometheus metrics exporter: %w", err)
	}
	mp := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(promExporter),
		sdkmetric.WithResource(res),
	)
	otel.SetMeterProvider(mp)

	// Go runtime metrics: goroutines, GC, heap, CGO, etc.
	if err := otelruntime.Start(otelruntime.WithMinimumReadMemStatsInterval(time.Second)); err != nil {
		zapLogger.Warn("failed to start Go runtime instrumentation", zap.Error(err))
	}
	// Host metrics: CPU time, memory usage, network I/O, process CPU.
	if err := otelhost.Start(); err != nil {
		zapLogger.Warn("failed to start host instrumentation", zap.Error(err))
	}

	return func(ctx context.Context) {
		if err := mp.Shutdown(ctx); err != nil {
			zapLogger.Error("meter provider shutdown error", zap.Error(err))
		}
	}, nil
}

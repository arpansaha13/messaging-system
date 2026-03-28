package app

import (
	"fmt"
	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/config"
)

// SetupMetricsServer returns an HTTP server that exposes Prometheus metrics on /metrics.
func SetupMetricsServer() (*http.Server, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, err
	}
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.Handler())
	return &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.MetricsPort()),
		Handler: mux,
	}, nil
}

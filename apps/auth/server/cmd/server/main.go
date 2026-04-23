package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/auth/server/internal/app"
	"github.com/arpansaha13/messaging-system/apps/auth/server/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/auth/server/internal/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	zapLogger, err := gtk.NewZapLogger(parseLogLevel(cfg.LogLevel()))
	if err != nil {
		log.Fatalf("failed to initialize logger: %v", err)
	}
	defer zapLogger.Sync()
	zap.ReplaceGlobals(zapLogger)

	zapLogger.Info("starting auth service", zap.String("environment", cfg.Environment().String()))

	shutdownTelemetry, err := app.SetupTelemetry(context.Background(), "auth", zapLogger)
	if err != nil {
		zapLogger.Fatal("failed to setup telemetry", zap.Error(err))
	}

	cbs := circuits.New(zapLogger)

	svcCtx := gtk.LoggerWithContext(context.Background(), zapLogger)

	db, err := app.SetupPostgres(svcCtx, zapLogger)
	if err != nil {
		zapLogger.Fatal("failed to connect to postgres", zap.Error(err))
	}

	// Setup memcached for session caching (optional; graceful degradation if unavailable)
	memcachedClient, memcachedConnMgr, err := app.SetupMemcached(svcCtx, zapLogger)
	if err != nil {
		zapLogger.Warn("failed to setup memcached", zap.Error(err))
	}

	grpcServer, emailPool := app.SetupGRPCServer(db, zapLogger, cbs, memcachedClient)

	grpcAddr := fmt.Sprintf("%s:%s", cfg.GRPCHost(), cfg.GRPCPort())
	listener, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		zapLogger.Fatal("failed to listen", zap.String("address", grpcAddr), zap.Error(err))
	}

	metricsServer, err := app.SetupMetricsServer()
	if err != nil {
		zapLogger.Fatal("failed to setup metrics server", zap.Error(err))
	}
	go func() {
		zapLogger.Info("Metrics server started", zap.Int("port", cfg.MetricsPort()))
		if err := metricsServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			zapLogger.Error("metrics server error", zap.Error(err))
		}
	}()

	go func() {
		zapLogger.Info("starting auth gRPC server", zap.String("address", grpcAddr))
		if err := grpcServer.Serve(listener); err != nil {
			zapLogger.Fatal("gRPC server error", zap.Error(err))
		}
	}()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	zapLogger.Info("shutting down auth gRPC server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	gracefulDone := make(chan struct{})
	go func() {
		grpcServer.GracefulStop()
		close(gracefulDone)
	}()

	select {
	case <-gracefulDone:
	case <-shutdownCtx.Done():
		zapLogger.Warn("graceful stop timed out, forcing stop")
		grpcServer.Stop()
	}

	if err := metricsServer.Shutdown(shutdownCtx); err != nil {
		zapLogger.Error("metrics server shutdown error", zap.Error(err))
	}

	if memcachedConnMgr != nil {
		if err := memcachedConnMgr.Stop(); err != nil {
			zapLogger.Error("error stopping memcached connection manager", zap.Error(err))
		}
	}

	shutdownTelemetry(shutdownCtx)

	emailPool.Stop()

	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.Close()
	}

	zapLogger.Info("auth gRPC server stopped")
}

func parseLogLevel(s string) zapcore.Level {
	var level zapcore.Level
	if err := level.UnmarshalText([]byte(s)); err != nil {
		return zapcore.InfoLevel
	}
	return level
}

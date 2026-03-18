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

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/auth/internal/app"
	"github.com/arpansaha13/messaging-system/apps/auth/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/auth/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	zapLogger, err := logger.InitLogger(parseLogLevel(cfg.LogLevel))
	if err != nil {
		log.Fatalf("failed to initialize logger: %v", err)
	}
	defer zapLogger.Sync()
	zap.ReplaceGlobals(zapLogger)

	zapLogger.Info("starting auth service", zap.String("environment", cfg.Environment.String()))

	shutdownTelemetry, err := app.SetupTelemetry(context.Background(), "auth", zapLogger)
	if err != nil {
		zapLogger.Fatal("failed to setup telemetry", zap.Error(err))
	}

	cbs := circuits.New(zapLogger)

	svcCtx := logger.WithContext(context.Background(), zapLogger)

	db, err := app.SetupPostgres(svcCtx, cfg.DatabaseURL, zapLogger)
	if err != nil {
		zapLogger.Fatal("failed to connect to postgres", zap.Error(err))
	}

	grpcServer, emailPool := app.SetupGRPCServer(cfg, db, zapLogger, cbs)

	grpcAddr := fmt.Sprintf("%s:%s", cfg.GRPCHost, cfg.GRPCPort)
	listener, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		zapLogger.Fatal("failed to listen", zap.String("address", grpcAddr), zap.Error(err))
	}

	metricsServer := app.SetupMetricsServer(cfg.MetricsPort)
	go func() {
		zapLogger.Info("Metrics server started", zap.Int("port", cfg.MetricsPort))
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

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	zapLogger.Info("shutting down auth gRPC server...")

	// Graceful shutdown with timeout
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

	shutdownTelemetry(shutdownCtx)

	// Stop email worker pool
	emailPool.Stop()

	// Close database connection
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

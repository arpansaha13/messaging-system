package main

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/user/internal/app"
	"github.com/arpansaha13/messaging-system/apps/user/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/user/internal/config"
	"go.uber.org/zap"
)

func main() {
	zapLogger, _ := zap.NewProduction()
	defer zapLogger.Sync()

	cfg, err := config.Load()
	if err != nil {
		zapLogger.Fatal("failed to load config", zap.Error(err))
	}

	shutdownTelemetry, err := app.SetupTelemetry(context.Background(), "user", zapLogger)
	if err != nil {
		zapLogger.Fatal("failed to setup telemetry", zap.Error(err))
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		shutdownTelemetry(ctx)
	}()

	cbs := circuits.NewCircuits()
	svcCtx := gtk.LoggerWithContext(context.Background(), zapLogger)
	db, err := app.SetupDB(svcCtx, cfg, zapLogger)
	if err != nil {
		zapLogger.Fatal("failed to connect to database", zap.Error(err))
	}
	deps := app.SetupDependencies(cfg, db, zapLogger, cbs)

	// gRPC Server
	grpcServer := app.SetupGRPCServer(deps, zapLogger)
	grpcAddr := fmt.Sprintf("%s:%s", cfg.GRPCHost(), cfg.GRPCPort())
	lis, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		zapLogger.Fatal("failed to listen on gRPC port", zap.Error(err))
	}

	go func() {
		zapLogger.Info("starting gRPC server", zap.String("addr", grpcAddr))
		if err := grpcServer.Serve(lis); err != nil {
			zapLogger.Error("gRPC server error", zap.Error(err))
		}
	}()

	// HTTP Server
	httpServer := app.SetupHTTPServer(cfg, deps, zapLogger)
	go func() {
		zapLogger.Info("starting HTTP server", zap.String("addr", httpServer.Addr))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			zapLogger.Error("HTTP server error", zap.Error(err))
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	zapLogger.Info("shutting down servers...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		zapLogger.Error("HTTP server shutdown error", zap.Error(err))
	}

	grpcServer.GracefulStop()
	deps.AuthClient.Close()

	zapLogger.Info("servers stopped")
}

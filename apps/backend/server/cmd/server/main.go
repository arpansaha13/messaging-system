package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/app"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/config"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

const serviceName string = "backend"

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	zapLogger, err := gtk.NewZapLogger(parseLogLevel(cfg.LogLevel()))
	if err != nil {
		log.Fatalf("failed to initialize logger: %v", err)
	}
	defer zapLogger.Sync()
	zap.ReplaceGlobals(zapLogger)

	shutdownTelemetry, err := app.SetupTelemetry(context.Background(), serviceName, zapLogger)
	if err != nil {
		zapLogger.Fatal("failed to setup telemetry", zap.Error(err))
	}

	cbs := circuits.New(zapLogger)

	svcCtx := gtk.LoggerWithContext(context.Background(), zapLogger)

	db, err := app.SetupPostgres(svcCtx, zapLogger)
	if err != nil {
		zapLogger.Fatal("failed to connect to postgres", zap.Error(err))
	}

	chatBroker, chatBrokerConnMgr, err := app.SetupChatBroker(svcCtx, zapLogger, cbs)
	if err != nil {
		zapLogger.Fatal("failed to setup chat broker", zap.Error(err))
	}

	authService, authConnMgr, err := app.SetupAuthService(svcCtx, zapLogger, cbs)
	if err != nil {
		log.Fatalf("failed to connect to auth service: %v", err)
	}

	router := app.SetupRouter(app.Deps{
		DB:         db,
		ChatBroker: chatBroker,
		AuthClient: authService,
		Circuits:   cbs,
		Logger:     zapLogger,
	})

	addr := fmt.Sprintf(":%d", cfg.APIPort())
	httpServer := &http.Server{
		Addr:         addr,
		Handler:      otelhttp.NewHandler(router, serviceName),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
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
		zapLogger.Info("Server started", zap.String("address", addr))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			zapLogger.Fatal("server error", zap.Error(err))
		}
	}()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	zapLogger.Info("Shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		zapLogger.Error("server shutdown error", zap.Error(err))
	}

	if err := metricsServer.Shutdown(shutdownCtx); err != nil {
		zapLogger.Error("metrics server shutdown error", zap.Error(err))
	}

	shutdownTelemetry(shutdownCtx)

	if err := authConnMgr.Stop(); err != nil {
		zap.L().Error("auth connection manager stop error", zap.Error(err))
	}

	if err := chatBrokerConnMgr.Stop(); err != nil {
		zap.L().Error("chat broker connection manager stop error", zap.Error(err))
	}

	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.Close()
	}

	zapLogger.Info("Server stopped")
}

func parseLogLevel(s string) zapcore.Level {
	var level zapcore.Level
	if err := level.UnmarshalText([]byte(s)); err != nil {
		return zapcore.InfoLevel
	}
	return level
}

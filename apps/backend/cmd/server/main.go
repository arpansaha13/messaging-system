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

	amqp "github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/app"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/pb"
)

const serviceName string = "backend"

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// Initialize logger (uptrace otelzap wrapping stdout JSON output)
	zapLogger, err := logger.InitLogger(parseLogLevel(cfg.LogLevel))
	if err != nil {
		log.Fatalf("failed to initialize logger: %v", err)
	}
	defer zapLogger.Sync()
	zap.ReplaceGlobals(zapLogger)

	// Initialize circuit breakers
	cbs := circuits.New(zapLogger)

	// Initialize database
	svcCtx := logger.WithContext(context.Background(), zapLogger)
	gormCfg := gorm.Config{
		Logger: gotoolkit.NewGormLogger(zapLogger, gormlogger.Warn),
	}
	db, err := gotoolkit.ConnectPostgresWithBackoff(svcCtx, cfg.DatabaseURL, &gormCfg)
	if err != nil {
		zapLogger.Fatal("failed to connect to postgres", zap.Error(err))
	}

	// Initialize RabbitMQ service
	rabbitmqService := service.NewRabbitMQService(zapLogger, cbs.RabbitMQ)

	// Create a buffered channel for RabbitMQ connection signals
	amqpConnectSignal := make(chan struct{}, 1)

	// Push initial signal to trigger first connection attempt
	amqpConnectSignal <- struct{}{}

	// Start goroutine for RabbitMQ connection management with auto-reconnect
	go func() {
		for range amqpConnectSignal {
			// Unset current connection if any
			rabbitmqService.UnsetConnection()

			// Attempt to connect to RabbitMQ
			amqpConn, err := gotoolkit.ConnectRabbitMQWithBackoff(svcCtx, cfg.RabbitMQURL)
			if err != nil {
				zapLogger.Error("failed to connect to rabbitmq", zap.Error(err))
				// Push signal again to retry
				select {
				case amqpConnectSignal <- struct{}{}:
				default:
					// Signal channel already has a pending signal
				}
				continue
			}

			// Set the new connection
			if err := rabbitmqService.SetConnection(amqpConn); err != nil {
				zapLogger.Error("failed to set rabbitmq connection", zap.Error(err))
				// Close the connection and retry
				amqpConn.Close()
				select {
				case amqpConnectSignal <- struct{}{}:
				default:
					// Signal channel already has a pending signal
				}
				continue
			}

			zapLogger.Info("RabbitMQ connected successfully")

			// Listen for connection close event
			go func(conn *amqp.Connection) {
				<-conn.NotifyClose(make(chan *amqp.Error, 1))
				zapLogger.Warn("RabbitMQ connection closed, attempting to reconnect")
				// TODO: What if the connection is intentially closed during shutdown? We should have a way to distinguish that and not attempt reconnection in that case.
				// Push signal to trigger reconnection
				select {
				case amqpConnectSignal <- struct{}{}:
				default:
					// Signal channel already has a pending signal
				}
			}(amqpConn)
		}
	}()

	// Give the connection goroutine time to establish initial connection
	time.Sleep(100 * time.Millisecond)

	// Initialize gRPC auth service connection
	conn, err := grpc.NewClient(
		cfg.AuthSystemHost,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("failed to connect to auth service: %v", err)
	}

	authService := service.NewAuthService(conn, pb.NewAuthServiceClient(conn), cbs.AuthGRPC)

	// Assemble HTTP server with all components
	addr := fmt.Sprintf(":%d", cfg.APIPort)
	httpServer := app.New(app.Deps{
		DB:          db,
		RabbitMQ:    rabbitmqService,
		AuthClient:  authService,
		Circuits:    cbs,
		Logger:      zapLogger,
		ServiceName: serviceName,
		Addr:        addr,
	})

	// Start server in a goroutine
	go func() {
		zapLogger.Info("Server started", zap.String("address", addr))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			zapLogger.Fatal("server error", zap.Error(err))
		}
	}()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	zapLogger.Info("Shutting down server...")

	// Graceful shutdown with timeout
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		zapLogger.Error("server shutdown error", zap.Error(err))
	}

	// Close auth service connection
	if err := authService.Close(); err != nil {
		zap.L().Error("auth service close error", zap.Error(err))
	}

	// Close RabbitMQ connection
	if rabbitmqService != nil {
		if err := rabbitmqService.Close(); err != nil {
			zap.L().Error("RabbitMQ close error", zap.Error(err))
		}
	}

	// Close database connection
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

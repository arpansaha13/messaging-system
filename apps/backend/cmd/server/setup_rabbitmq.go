package main

import (
	"context"
	"fmt"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
)

// setupRabbitMQ initializes the RabbitMQ connection manager with auto-reconnect support.
// It creates a ConnectionManager, starts it, and returns it for lifecycle management.
func setupRabbitMQ(
	ctx context.Context,
	cfg *config.Config,
	zapLogger *zap.Logger,
	rabbitmqService *service.RabbitMQService,
) (*gotoolkit.ConnectionManager, error) {
	// Declare connection manager variable first (for closure capture)
	var rabbitMQConnMgr *gotoolkit.ConnectionManager

	// Initialize RabbitMQ connection manager with auto-reconnect support
	rabbitMQConnMgr = gotoolkit.NewConnectionManager(
		gotoolkit.ReconnectConfig{
			ConnectTimeout:    15 * time.Second,
			ReconnectInterval: 500 * time.Millisecond,
		},
		zapLogger,
		// onConnect callback: establish connection and monitor for close
		func(connectCtx context.Context) error {
			amqpConn, err := gotoolkit.ConnectRabbitMQWithBackoff(connectCtx, cfg.RabbitMQURL)
			if err != nil {
				return err
			}

			// Set connection in service
			if err := rabbitmqService.SetConnection(amqpConn); err != nil {
				amqpConn.Close()
				return err
			}

			// Monitor for connection close and trigger reconnect
			go func(conn *amqp.Connection) {
				<-conn.NotifyClose(make(chan *amqp.Error, 1))
				zapLogger.Warn("RabbitMQ connection closed, triggering reconnect")
				rabbitMQConnMgr.Signal()
			}(amqpConn)

			return nil
		},
		// onDisconnect callback: cleanup
		func() {
			rabbitmqService.UnsetConnection()
		},
	)

	// Start the RabbitMQ connection manager
	if err := rabbitMQConnMgr.Start(ctx); err != nil {
		return nil, fmt.Errorf("failed to start rabbitmq connection manager: %w", err)
	}

	return rabbitMQConnMgr, nil
}

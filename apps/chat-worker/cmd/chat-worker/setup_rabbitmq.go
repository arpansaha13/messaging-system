package main

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/config"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/controller"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/processor"
	commonbr "github.com/arpansaha13/messaging-system/apps/common/broker"
)

// setupRabbitMQ initializes the RabbitMQ connection manager with auto-reconnect support.
// It creates processors, event controller, setupConsumers function, initializes the ConnectionManager,
// starts it, and returns it for lifecycle management.
func setupRabbitMQ(
	ctx context.Context,
	cfg *config.Config,
	logger *zap.Logger,
	db *gorm.DB,
	amqpURL string,
	cbs *circuits.Circuits,
) (*gotoolkit.ConnectionManager, error) {
	// Initialize RabbitMQ broker
	messageBroker := broker.NewRabbitMQBroker(amqpURL, cbs.RabbitMQ)

	// Initialize processors (persist across reconnects)
	messageProcessor := processor.NewMessageProcessor(db, messageBroker, cbs.Postgres)
	statusProcessor := processor.NewStatusProcessor(db, messageBroker, cbs.Postgres)
	connectionProcessor := processor.NewConnectionProcessor(db, messageBroker, cbs.Postgres)

	// Initialize event controller with dependency injection (persist across reconnects)
	eventController := controller.NewEventController(messageProcessor, statusProcessor, connectionProcessor)

	// Declare connection manager variable first (for closure capture)
	var rabbitMQConnMgr *gotoolkit.ConnectionManager

	// Helper function to setup consumers
	setupConsumers := func() error {
		// Setup worker queue consumer
		if err := messageBroker.ConsumeWorkerQueue(func(msg *commonbr.MessagePayload, ack func()) error {
			if err := eventController.HandleWorkerQueueEvent(ctx, msg); err != nil {
				logger.Error("error handling worker queue event", zap.Error(err))
			}
			ack()
			return nil
		}); err != nil {
			return fmt.Errorf("failed to setup worker queue consumer: %w", err)
		}

		// Setup connection queue consumer
		if err := messageBroker.ConsumeConnectionQueue(func(msg *commonbr.UserConnectionPayload, ack func()) error {
			if err := eventController.HandleConnectionQueueEvent(ctx, msg); err != nil {
				logger.Error("error handling connection queue event", zap.Error(err))
			}
			ack()
			return nil
		}); err != nil {
			return fmt.Errorf("failed to setup connection queue consumer: %w", err)
		}

		return nil
	}

	// Initialize RabbitMQ connection manager with auto-reconnect support
	rabbitMQConnMgr = gotoolkit.NewConnectionManager(
		gotoolkit.ReconnectConfig{
			ConnectTimeout:    15 * time.Second,
			ReconnectInterval: 500 * time.Millisecond,
		},
		logger,
		// onConnect callback: connect broker and setup consumers
		func(connectCtx context.Context) error {
			if err := messageBroker.Connect(connectCtx); err != nil {
				return err
			}

			// Setup consumers after successful connection
			if err := setupConsumers(); err != nil {
				messageBroker.Disconnect()
				return err
			}

			return nil
		},
		// onDisconnect callback: cleanup
		func() {
			messageBroker.Disconnect()
		},
	)

	// Start the RabbitMQ connection manager
	if err := rabbitMQConnMgr.Start(ctx); err != nil {
		return nil, fmt.Errorf("failed to start rabbitmq connection manager: %w", err)
	}

	return rabbitMQConnMgr, nil
}

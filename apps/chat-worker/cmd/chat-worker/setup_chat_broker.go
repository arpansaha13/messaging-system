package main

import (
	"context"
	"fmt"
	"time"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/config"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/controller"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/processor"
	commonbr "github.com/arpansaha13/messaging-system/apps/common/broker"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gorm.io/gorm"
)

// setupChatBroker initializes the ChatBroker connection manager with auto-reconnect support.
// Returns the manager for graceful shutdown in main.
func setupChatBroker(
	ctx context.Context,
	creds config.RabbitMQCreds,
	logger *zap.Logger,
	db *gorm.DB,
	cbs *circuits.Circuits,
) (*gtk.ConnectionManager, error) {
	// Initialize ChatBroker
	chatBroker := broker.NewRabbitMQBroker(creds.GetUrl(), cbs.RabbitMQ)
	var chatBrokerConnMgr *gtk.ConnectionManager

	chatBroker.SetDisconnectHandler(func(err error) {
		if err != nil {
			logger.Warn("ChatBroker connection closed, triggering reconnect", zap.Error(err))
		} else {
			logger.Warn("ChatBroker connection closed, triggering reconnect")
		}
		if chatBrokerConnMgr != nil {
			chatBrokerConnMgr.Signal()
		}
	})

	// Initialize processors (persist across reconnects)
	statusProcessor := processor.NewStatusProcessor(db, chatBroker, cbs.Postgres)
	connectionProcessor := processor.NewConnectionProcessor(db, chatBroker, cbs.Postgres)

	// Initialize event controller with dependency injection (persist across reconnects)
	eventController := controller.NewEventController(statusProcessor, connectionProcessor)

	// Helper function to setup consumers
	setupConsumers := func() error {
		// Setup worker queue consumer
		if err := chatBroker.ConsumeWorkerQueue(func(msg *commonbr.MessagePayload, ack func()) error {
			if err := eventController.HandleWorkerQueueEvent(ctx, msg); err != nil {
				logger.Error("error handling worker queue event", zap.Error(err))
			}
			ack()
			return nil
		}); err != nil {
			return fmt.Errorf("failed to setup worker queue consumer: %w", err)
		}

		// Setup connection queue consumer
		if err := chatBroker.ConsumeConnectionQueue(func(msg *commonbr.UserConnectionPayload, ack func()) error {
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

	chatBrokerConnMgr = gtk.NewConnectionManager(
		gtk.ReconnectConfig{
			ConnectTimeout:    15 * time.Second,
			ReconnectInterval: 500 * time.Millisecond,
		},
		logger,
		func(connectCtx context.Context) error {
			if err := chatBroker.Connect(
				connectCtx,
				gtk.WithPermanentErrorLogLevel(zapcore.ErrorLevel),
			); err != nil {
				return err
			}
			if err := setupConsumers(); err != nil {
				chatBroker.Disconnect()
				return err
			}
			return nil
		},
		func() {
			chatBroker.Disconnect()
		},
	)

	if err := chatBrokerConnMgr.Start(ctx); err != nil {
		return nil, fmt.Errorf("failed to start chat broker connection manager: %w", err)
	}

	return chatBrokerConnMgr, nil
}

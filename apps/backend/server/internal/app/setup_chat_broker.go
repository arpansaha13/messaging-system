package app

import (
	"context"
	"fmt"
	"time"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/config"
	"go.uber.org/zap"
)

// SetupChatBroker creates a ChatBroker and a ConnectionManager with auto-reconnect.
// Returns the broker (for injection into app) and the manager (for graceful shutdown in main).
func SetupChatBroker(
	ctx context.Context,
	zapLogger *zap.Logger,
	cbs *circuits.Circuits,
) (broker.ChatBroker, *gtk.ConnectionManager, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, nil, err
	}

	chatBroker := broker.NewRabbitMQBroker(cfg.RabbitMQURL(), zapLogger, cbs.RabbitMQ)

	var brokerConnMgr *gtk.ConnectionManager

	chatBroker.SetDisconnectHandler(func(err error) {
		if err != nil {
			zapLogger.Warn("ChatBroker connection closed, triggering reconnect", zap.Error(err))
		} else {
			zapLogger.Warn("ChatBroker connection closed, triggering reconnect")
		}
		if brokerConnMgr != nil {
			brokerConnMgr.Signal()
		}
	})

	brokerConnMgr = gtk.NewConnectionManager(
		gtk.ReconnectConfig{
			ConnectTimeout:    15 * time.Second,
			ReconnectInterval: 500 * time.Millisecond,
		},
		zapLogger,
		func(connectCtx context.Context) error {
			if err := chatBroker.Connect(connectCtx); err != nil {
				return err
			}
			return nil
		},
		func() {
			chatBroker.Disconnect()
		},
	)

	if err := brokerConnMgr.Start(ctx); err != nil {
		return nil, nil, fmt.Errorf("failed to start chat broker connection manager: %w", err)
	}

	return chatBroker, brokerConnMgr, nil
}

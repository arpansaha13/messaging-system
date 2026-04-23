package app

import (
	"context"
	"fmt"
	"time"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/service"
	amqp "github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
)

// SetupRabbitMQ creates a RabbitMQService and a ConnectionManager with auto-reconnect.
// Returns the service (for injection into app) and the manager (for graceful shutdown in main).
func SetupRabbitMQ(
	ctx context.Context,
	zapLogger *zap.Logger,
	cbs *circuits.Circuits,
) (*service.RabbitMQService, *gtk.ConnectionManager, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, nil, err
	}

	rabbitmqService := service.NewRabbitMQService(zapLogger, cbs.RabbitMQ)

	var rabbitMQConnMgr *gtk.ConnectionManager

	rabbitMQConnMgr = gtk.NewConnectionManager(
		gtk.ReconnectConfig{
			ConnectTimeout:    15 * time.Second,
			ReconnectInterval: 500 * time.Millisecond,
		},
		zapLogger,
		func(connectCtx context.Context) error {
			amqpConn, err := gtk.ConnectRabbitMQWithBackoff(connectCtx, cfg.RabbitMQURL())
			if err != nil {
				return err
			}
			if err := rabbitmqService.SetConnection(amqpConn); err != nil {
				amqpConn.Close()
				return err
			}
			go func(conn *amqp.Connection) {
				<-conn.NotifyClose(make(chan *amqp.Error, 1))
				zapLogger.Warn("RabbitMQ connection closed, triggering reconnect")
				rabbitMQConnMgr.Signal()
			}(amqpConn)
			return nil
		},
		func() {
			rabbitmqService.UnsetConnection()
		},
	)

	if err := rabbitMQConnMgr.Start(ctx); err != nil {
		return nil, nil, fmt.Errorf("failed to start rabbitmq connection manager: %w", err)
	}

	return rabbitmqService, rabbitMQConnMgr, nil
}

package app

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/config"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/constants"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/store"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/ws"
)

// setupRabbitMQ creates a RabbitMQBroker and a ConnectionManager with auto-reconnect.
// Returns the broker (for injection into app) and the manager (for graceful shutdown in main).
func SetupRabbitMQ(
	ctx context.Context,
	creds config.RabbitMQCreds,
	serverId string,
	log *zap.Logger,
	hub *ws.Hub,
	chatsStore *store.ChatsStore,
	groupHandlers *ws.GroupHandlers,
) (*broker.RabbitMQBroker, *gotoolkit.ConnectionManager, error) {
	rabbitBroker := broker.NewRabbitMQBroker(creds.GetUrl(), serverId, log)

	setupConsumers := func() error {
		// Server-queue consumer: route messages to the correct socket or room.
		if err := rabbitBroker.ConsumeFromServerQueue(func(msg *broker.ServerQueueMessage, ack func()) {
			defer ack()
			switch {
			case msg.UserId != nil:
				socketId, ok := chatsStore.GetClient(*msg.UserId)
				if ok {
					if err := hub.EmitToSocket(socketId, msg.Event, msg.Data); err != nil {
						log.Error("emit to socket failed", zap.Error(err))
					}
				}
			case msg.ChannelId != nil:
				if err := hub.EmitToRoom(strconv.FormatInt(*msg.ChannelId, 10), msg.Event, msg.Data); err != nil {
					log.Error("emit to channel room failed", zap.Error(err))
				}
			case msg.GroupId != nil:
				// For group:new-channel, also join sockets to the new channel room.
				if msg.Event == constants.GroupNewChannel && msg.ChannelId != nil {
					groupHandlers.HandleNewChannelFromBroker(*msg.GroupId, *msg.ChannelId)
				} else {
					if err := hub.EmitToRoom(fmt.Sprintf("group-%d", *msg.GroupId), msg.Event, msg.Data); err != nil {
						log.Error("emit to group room failed", zap.Error(err))
					}
				}
			}
		}); err != nil {
			return fmt.Errorf("failed to setup server queue consumer: %w", err)
		}

		// Subscription-queue consumer: bind channels/groups and join rooms for a user.
		if err := rabbitBroker.ConsumeFromSubscriptionQueue(func(msg *broker.SubscriptionMessage, ack func()) {
			defer ack()

			socketId, ok := chatsStore.GetClient(msg.UserId)
			if !ok {
				return
			}

			for _, channelId := range msg.ChannelIds {
				if err := rabbitBroker.BindChannelToQueue(channelId); err != nil {
					log.Error("failed to bind channel", zap.Int64("channel_id", channelId), zap.Error(err))
				}
			}
			for _, groupId := range msg.GroupIds {
				if err := rabbitBroker.BindGroupToQueue(groupId); err != nil {
					log.Error("failed to bind group", zap.Int64("group_id", groupId), zap.Error(err))
				}
			}

			channelRooms := make([]string, len(msg.ChannelIds))
			for i, id := range msg.ChannelIds {
				channelRooms[i] = strconv.FormatInt(id, 10)
			}
			hub.RoomsJoin(socketId, channelRooms)

			chatsStore.AddUserChannels(msg.UserId, msg.ChannelIds)
			chatsStore.AddUserGroups(msg.UserId, msg.GroupIds)

			for _, groupId := range msg.GroupIds {
				chatsStore.AddSocketToGroup(groupId, socketId)
				hub.JoinRoom(socketId, fmt.Sprintf("group-%d", groupId))
			}

			log.Info("subscribed user to channels and groups",
				zap.Int64("user_id", msg.UserId),
				zap.Int64s("channels", msg.ChannelIds),
				zap.Int64s("groups", msg.GroupIds),
			)
		}); err != nil {
			return fmt.Errorf("failed to setup subscription queue consumer: %w", err)
		}

		return nil
	}

	rabbitMQConnMgr := gotoolkit.NewConnectionManager(
		gotoolkit.ReconnectConfig{
			ConnectTimeout:    15 * time.Second,
			ReconnectInterval: 500 * time.Millisecond,
		},
		log,
		func(connectCtx context.Context) error {
			if err := rabbitBroker.Connect(connectCtx); err != nil {
				return err
			}
			if err := setupConsumers(); err != nil {
				rabbitBroker.Disconnect()
				return fmt.Errorf("failed to setup consumers: %w", err)
			}
			return nil
		},
		func() {
			rabbitBroker.Disconnect()
		},
	)

	if err := rabbitMQConnMgr.Start(ctx); err != nil {
		return nil, nil, fmt.Errorf("failed to start rabbitmq connection manager: %w", err)
	}

	return rabbitBroker, rabbitMQConnMgr, nil
}

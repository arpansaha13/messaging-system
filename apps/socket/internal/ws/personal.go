package ws

import (
	"encoding/json"
	"strconv"

	"go.uber.org/zap"

	"github.com/arpansaha13/messaging-system/apps/socket/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/cache"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/constants"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/store"
	commonbr "github.com/arpansaha13/messaging-system/apps/common/broker"
)

// PersonalHandlers handles all events related to 1-to-1 personal chats.
type PersonalHandlers struct {
	store  *store.ChatsStore
	cache  *cache.MemcachedService
	broker broker.ChatBroker
	hub    *Hub
	log    *zap.Logger
}

// NewPersonalHandlers creates a PersonalHandlers.
func NewPersonalHandlers(
	st *store.ChatsStore,
	mc *cache.MemcachedService,
	br broker.ChatBroker,
	hub *Hub,
	log *zap.Logger,
) *PersonalHandlers {
	return &PersonalHandlers{store: st, cache: mc, broker: br, hub: hub, log: log}
}

// HandleConnect is called when a new WebSocket connection is established.
// It registers the user in the store, publishes a USER_CONNECTED event to the
// chat-worker, and binds the user's routing key to this server's queue.
func (p *PersonalHandlers) HandleConnect(client *Client) {
	p.store.SetClient(client.userId, client.id)

	if err := p.broker.PublishToIncoming("connection.user", commonbr.UserConnectionPayload{
		UserId:   client.userId,
		ServerId: p.broker.GetServerId(),
	}); err != nil {
		p.log.Error("failed to publish USER_CONNECTED",
			zap.Int64("user_id", client.userId),
			zap.Error(err),
		)
	}

	if err := p.broker.BindUserToQueue(client.userId); err != nil {
		p.log.Error("failed to bind user to queue",
			zap.Int64("user_id", client.userId),
			zap.Error(err),
		)
	}

	p.log.Info("user connected",
		zap.String("socket_id", client.id),
		zap.Int64("user_id", client.userId),
	)
}

// HandleDisconnect is called when the WebSocket connection closes.
// It cleans up AMQP bindings and store state for the user.
func (p *PersonalHandlers) HandleDisconnect(client *Client) {
	p.store.DeleteClient(client.userId)

	if err := p.broker.UnbindUserFromQueue(client.userId); err != nil {
		p.log.Error("failed to unbind user from queue",
			zap.Int64("user_id", client.userId),
			zap.Error(err),
		)
	}

	channelIds, groupIds := p.store.RemoveUserChannelsAndGroups(client.userId)

	for _, channelId := range channelIds {
		if !p.store.HasChannelSubscribers(channelId) {
			if err := p.broker.UnbindChannelFromQueue(channelId); err != nil {
				p.log.Error("failed to unbind channel from queue",
					zap.Int64("channel_id", channelId),
					zap.Error(err),
				)
			}
		}
	}

	for _, groupId := range groupIds {
		p.store.RemoveSocketFromGroup(groupId, client.id)
		if !p.store.HasGroupSubscribers(groupId) {
			if err := p.broker.UnbindGroupFromQueue(groupId); err != nil {
				p.log.Error("failed to unbind group from queue",
					zap.Int64("group_id", groupId),
					zap.Error(err),
				)
			}
		}
	}

	p.log.Info("user disconnected",
		zap.String("socket_id", client.id),
		zap.Int64("user_id", client.userId),
		zap.Int("channels_unbound", len(channelIds)),
		zap.Int("groups_unbound", len(groupIds)),
	)
}

// typingPayload is the client-sent payload for personal:typing events.
type typingPayload struct {
	SenderId   int64 `json:"senderId"`
	ReceiverId int64 `json:"receiverId"`
	IsTyping   bool  `json:"isTyping"`
}

// HandleTyping forwards a typing indicator directly to the outgoing exchange
// using the receiver's userId as routing key. The receiving server instance
// (whichever has the receiver connected) picks it up and forwards it to the socket.
func (p *PersonalHandlers) HandleTyping(client *Client, raw json.RawMessage) {
	var payload typingPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		p.log.Warn("invalid typing payload", zap.Error(err))
		return
	}

	if err := p.broker.PublishToOutgoing(strconv.FormatInt(payload.ReceiverId, 10), map[string]any{
		"event":  constants.PersonalTyping,
		"userId": payload.ReceiverId,
		"data": map[string]any{
			"senderId":   payload.SenderId,
			"receiverId": payload.ReceiverId,
			"isTyping":   payload.IsTyping,
		},
	}); err != nil {
		p.log.Error("failed to publish typing event", zap.Error(err))
	}
}

// checkOnlinePayload is the client-sent payload for personal:check-online events.
type checkOnlinePayload struct {
	UserIds []int64 `json:"userIds"`
}

// HandleCheckOnline queries Memcached for each requested user's online status
// and emits the result back to the requesting socket.
func (p *PersonalHandlers) HandleCheckOnline(client *Client, raw json.RawMessage) {
	var payload checkOnlinePayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		p.log.Warn("invalid check-online payload", zap.Error(err))
		return
	}

	statuses, err := p.cache.GetBatchOnlineStatus(payload.UserIds)
	if err != nil {
		p.log.Error("error checking online status", zap.Error(err))
		// Fall back to all-false — same behaviour as the Node.js version.
		statuses = make(map[int64]bool, len(payload.UserIds))
		for _, id := range payload.UserIds {
			statuses[id] = false
		}
	}

	if err := p.hub.EmitToSocket(client.id, constants.PersonalCheckOnlineResp, map[string]any{
		"statuses": statuses,
	}); err != nil {
		p.log.Error("failed to emit check-online response", zap.Error(err))
	}
}

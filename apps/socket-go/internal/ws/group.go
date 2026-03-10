package ws

import (
	"encoding/json"
	"strconv"
	"strings"

	"go.uber.org/zap"

	"github.com/arpansaha13/messaging-system/apps/socket-go/internal/constants"
	"github.com/arpansaha13/messaging-system/apps/socket-go/internal/store"
)

// GroupHandlers handles events related to group and channel management.
type GroupHandlers struct {
	store *store.ChatsStore
	hub   *Hub
	log   *zap.Logger
}

// NewGroupHandlers creates a GroupHandlers.
func NewGroupHandlers(st *store.ChatsStore, hub *Hub, log *zap.Logger) *GroupHandlers {
	return &GroupHandlers{store: st, hub: hub, log: log}
}

// newGroupPayload is the client-sent payload for group:new-group and group:join-group.
type newGroupPayload struct {
	GroupId  int64  `json:"groupId"`
	Channels string `json:"channels"` // comma-separated channel IDs
}

// HandleNewGroup registers the socket in the group and joins its channels.
// Called when the client sends group:new-group (user just created a group).
func (g *GroupHandlers) HandleNewGroup(client *Client, raw json.RawMessage) {
	var payload newGroupPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		g.log.Warn("invalid new-group payload", zap.Error(err))
		return
	}
	g.store.AddSocketToGroup(payload.GroupId, client.id)
	g.hub.RoomsJoin(client.id, splitChannelIds(payload.Channels))
}

// HandleJoinGroup registers the socket in the group and joins its channels.
// Called when the client sends group:join-group (user just joined an existing group).
func (g *GroupHandlers) HandleJoinGroup(client *Client, raw json.RawMessage) {
	var payload newGroupPayload // same shape as newGroupPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		g.log.Warn("invalid join-group payload", zap.Error(err))
		return
	}
	g.store.AddSocketToGroup(payload.GroupId, client.id)
	g.hub.RoomsJoin(client.id, splitChannelIds(payload.Channels))
}

// NewChannelPayload carries the routing info for a group:new-channel event
// received from the broker server queue.
type NewChannelPayload struct {
	GroupId   int64 `json:"groupId"`
	ChannelId int64 `json:"channelId"`
}

// HandleNewChannelFromBroker is called by the server-queue consumer when the
// backend publishes a group:new-channel event. It adds all sockets in the group
// to the new channel's room and notifies them of the new channel.
//
// This handles the socketsJoin step that is missing from the Node.js server-queue
// consumer path — ensuring sockets receive future messages in the new channel.
func (g *GroupHandlers) HandleNewChannelFromBroker(groupId, channelId int64) {
	socketIds := g.store.GetSocketsInGroup(groupId)
	if len(socketIds) == 0 {
		return
	}
	channelRoom := strconv.FormatInt(channelId, 10)
	for _, socketId := range socketIds {
		g.hub.JoinRoom(socketId, channelRoom)
		if err := g.hub.EmitToSocket(socketId, constants.GroupNewChannel, map[string]any{
			"groupId": groupId,
		}); err != nil {
			g.log.Error("failed to emit new-channel event", zap.Error(err))
		}
	}
}

// splitChannelIds parses a comma-separated string of channel IDs into room-ID strings.
func splitChannelIds(csv string) []string {
	if csv == "" {
		return nil
	}
	parts := strings.Split(csv, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			result = append(result, t)
		}
	}
	return result
}

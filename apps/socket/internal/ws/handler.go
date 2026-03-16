package ws

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"

	"github.com/arpansaha13/messaging-system/apps/socket/internal/constants"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/store"
)

// NewUpgrader returns a gorilla WebSocket upgrader that validates the Origin
// header against clientDomain. If clientDomain is empty, all origins are
// accepted (useful in development when CLIENT_DOMAIN is not set).
func NewUpgrader(clientDomain string) websocket.Upgrader {
	return websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			if clientDomain == "" {
				return true
			}
			return r.Header.Get("Origin") == clientDomain
		},
	}
}

// ServeWs upgrades an HTTP request to a WebSocket connection, creates a Client,
// registers it with the Hub, fires the connect lifecycle, and starts the read/write pumps.
//
// Query param: ?userId=<int64>  (required)
func ServeWs(
	hub *Hub,
	st *store.ChatsStore,
	dispatch func(client *Client, msg IncomingMessage),
	onConnect func(client *Client),
	onDisconnect func(client *Client),
	upgrader websocket.Upgrader,
	log *zap.Logger,
	w http.ResponseWriter,
	r *http.Request,
) {
	// userId is set in context by AuthMiddleware after session validation
	userIdStr := middleware.GetUserIDFromContext(r)
	userId, err := strconv.ParseInt(userIdStr, 10, 64)
	if err != nil || userId <= 0 {
		http.Error(w, "missing or invalid userId in context", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Error("websocket upgrade failed", zap.Error(err))
		return
	}

	client := &Client{
		id:     uuid.New().String(),
		userId: userId,
		conn:   conn,
		send:   make(chan []byte, 256),
		hub:    hub,
	}

	hub.Register(client)
	onConnect(client)

	go client.WritePump(log)
	go client.ReadPump(st, dispatch, onDisconnect, log)
}

// BuildDispatcher returns the event routing function used by ReadPump.
// It maps incoming event names to the appropriate handler.
func BuildDispatcher(personal *PersonalHandlers, group *GroupHandlers, log *zap.Logger) func(*Client, IncomingMessage) {
	return func(client *Client, msg IncomingMessage) {
		switch msg.Event {
		case constants.PersonalTyping:
			personal.HandleTyping(client, msg.Data)
		case constants.PersonalCheckOnline:
			personal.HandleCheckOnline(client, msg.Data)
		case constants.GroupNewGroup:
			group.HandleNewGroup(client, msg.Data)
		case constants.GroupJoinGroup:
			group.HandleJoinGroup(client, msg.Data)
		default:
			log.Debug("unhandled event", zap.String("event", msg.Event), zap.String("socket_id", client.id))
		}
	}
}

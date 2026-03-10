package ws

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"go.uber.org/zap"

	"github.com/arpansaha13/messaging-system/apps/socket-go/internal/store"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10 // must be less than pongWait
	maxMessageSize = 4096
)

// IncomingMessage is the JSON envelope for client-to-server frames.
type IncomingMessage struct {
	Event string          `json:"event"`
	Data  json.RawMessage `json:"data"`
}

// Client represents a single WebSocket connection.
//
// It owns a buffered send channel. The channel is closed exactly once via
// closeOnce(), which is called by Hub.Unregister. WritePump exits when the
// channel is closed.  trySend() checks the closed state before writing,
// preventing a send-on-closed-channel panic.
type Client struct {
	id     string
	userId int64
	conn   *websocket.Conn
	send   chan []byte
	hub    *Hub

	mu     sync.Mutex
	closed bool
}

// closeOnce closes the send channel exactly once. Safe to call from multiple goroutines.
func (c *Client) closeOnce() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if !c.closed {
		c.closed = true
		close(c.send)
	}
}

// trySend delivers msg to the send channel without blocking.
// Returns false if the client is closed or the buffer is full.
func (c *Client) trySend(msg []byte) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.closed {
		return false
	}
	select {
	case c.send <- msg:
		return true
	default:
		return false
	}
}

// ReadPump reads frames from the WebSocket connection and dispatches events.
// It runs in its own goroutine. On exit it triggers the full disconnect lifecycle.
//
// The gorilla/websocket docs require that only one goroutine reads from the
// connection at a time — this is that goroutine.
func (c *Client) ReadPump(
	st *store.ChatsStore,
	dispatch func(client *Client, msg IncomingMessage),
	onDisconnect func(client *Client),
	log *zap.Logger,
) {
	defer func() {
		onDisconnect(c)
		c.hub.Unregister(c)
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))

	// Pong handler: extend read deadline and record the ping for online-status flushing.
	c.conn.SetPongHandler(func(string) error {
		st.TrackPing(c.userId)
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, rawMsg, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Warn("websocket read error", zap.String("socket_id", c.id), zap.Error(err))
			}
			break
		}

		var msg IncomingMessage
		if err := json.Unmarshal(rawMsg, &msg); err != nil {
			log.Warn("failed to unmarshal client message",
				zap.String("socket_id", c.id),
				zap.Error(err),
			)
			continue
		}

		dispatch(c, msg)
	}
}

// WritePump drains the send channel to the WebSocket connection and sends
// periodic Ping frames to keep the connection alive.
//
// The gorilla/websocket docs require that only one goroutine writes to the
// connection at a time — this is that goroutine.
func (c *Client) WritePump(log *zap.Logger) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub closed the channel — send a close frame and exit.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				log.Warn("websocket write error",
					zap.String("socket_id", c.id),
					zap.Error(err),
				)
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

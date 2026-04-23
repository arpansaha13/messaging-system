package ws

import (
	"encoding/json"
	"fmt"
	"sync"

	"go.uber.org/zap"
)

// WsMessage is the JSON envelope for all WebSocket frames (both directions).
type WsMessage struct {
	Event string          `json:"event"`
	Data  json.RawMessage `json:"data"`
}

// Hub is the central registry of active WebSocket clients and rooms.
//
// All state mutations are protected by a single RWMutex:
//   - RLock for reads (GetClient, EmitToSocket, EmitToRoom)
//   - Lock  for writes (Register, Unregister, JoinRoom, LeaveRoom, RoomsJoin)
//
// This keeps the locking simple and correct. For the expected connection count
// of a single socket-server instance, a single RWMutex has negligible contention.
type Hub struct {
	mu      sync.RWMutex
	clients map[string]*Client             // socketId → Client
	rooms   map[string]map[string]struct{} // roomId   → set of socketIds
	log     *zap.Logger
}

// NewHub creates a Hub.
func NewHub(log *zap.Logger) *Hub {
	return &Hub{
		clients: make(map[string]*Client),
		rooms:   make(map[string]map[string]struct{}),
		log:     log,
	}
}

// Register adds a client to the hub.
func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c.id] = c
}

// Unregister removes a client from the hub and all rooms, then signals the
// client's write pump to stop.
func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.clients[c.id]; ok {
		delete(h.clients, c.id)
		for _, sockets := range h.rooms {
			delete(sockets, c.id)
		}
		c.closeOnce() // signal WritePump; safe to call multiple times
	}
}

// GetClient returns the client for socketId.
func (h *Hub) GetClient(socketId string) (*Client, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	c, ok := h.clients[socketId]
	return c, ok
}

// JoinRoom adds a socket to a room (creates the room if needed).
func (h *Hub) JoinRoom(socketId, roomId string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.rooms[roomId]; !ok {
		h.rooms[roomId] = make(map[string]struct{})
	}
	h.rooms[roomId][socketId] = struct{}{}
}

// LeaveRoom removes a socket from a room.
func (h *Hub) LeaveRoom(socketId, roomId string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if sockets, ok := h.rooms[roomId]; ok {
		delete(sockets, socketId)
		if len(sockets) == 0 {
			delete(h.rooms, roomId)
		}
	}
}

// RoomsJoin adds a socket to multiple rooms in a single lock acquisition.
func (h *Hub) RoomsJoin(socketId string, roomIds []string) {
	if len(roomIds) == 0 {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	for _, roomId := range roomIds {
		if _, ok := h.rooms[roomId]; !ok {
			h.rooms[roomId] = make(map[string]struct{})
		}
		h.rooms[roomId][socketId] = struct{}{}
	}
}

// EmitToSocket sends an event+data frame to a single socket.
// If the socket's send buffer is full, the frame is dropped with a warning.
func (h *Hub) EmitToSocket(socketId, event string, data any) error {
	payload, err := marshalFrame(event, data)
	if err != nil {
		return err
	}

	h.mu.RLock()
	c, ok := h.clients[socketId]
	h.mu.RUnlock()

	if ok {
		if !c.trySend(payload) {
			h.log.Warn("dropping message: client disconnected or buffer full",
				zap.String("socket_id", socketId),
				zap.String("event", event),
			)
		}
	}
	return nil
}

// EmitToRoom sends an event+data frame to all sockets in a room.
func (h *Hub) EmitToRoom(roomId, event string, data any) error {
	payload, err := marshalFrame(event, data)
	if err != nil {
		return err
	}

	// Snapshot socket IDs under RLock to avoid holding the lock during sends.
	h.mu.RLock()
	sockets, ok := h.rooms[roomId]
	if !ok {
		h.mu.RUnlock()
		return nil
	}
	socketIds := make([]string, 0, len(sockets))
	for id := range sockets {
		socketIds = append(socketIds, id)
	}
	h.mu.RUnlock()

	for _, socketId := range socketIds {
		h.mu.RLock()
		c, exists := h.clients[socketId]
		h.mu.RUnlock()
		if exists {
			if !c.trySend(payload) {
				h.log.Warn("dropping room message: client disconnected or buffer full",
					zap.String("socket_id", socketId),
					zap.String("room_id", roomId),
					zap.String("event", event),
				)
			}
		}
	}
	return nil
}

// marshalFrame serialises event+data into the wire envelope:
// { "event": "...", "data": <raw json> }
//
// data may be any JSON-serialisable value, including json.RawMessage
// (which is embedded without re-encoding).
func marshalFrame(event string, data any) ([]byte, error) {
	raw, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("marshal data: %w", err)
	}
	return json.Marshal(WsMessage{Event: event, Data: raw})
}

package store

import "sync"

// ChatsStore is a thread-safe in-memory store for WebSocket connection state.
//
// It tracks:
//   - user → socket ID mapping (one connection per user)
//   - group → socket IDs set (for broadcasting to a group)
//   - ping activity set (flushed to Memcached on a ticker)
//   - per-user channel and group subscriptions with reference counting
//     (so AMQP bindings are released only when no subscriber remains)
//
// All exported methods are safe for concurrent use.
// Note: multiple simultaneous connections per user are not supported —
// a new connection for the same userId overwrites the previous entry.
type ChatsStore struct {
	userSocketMu  sync.RWMutex
	userSocketMap map[int64]string // userId → socketId

	groupSocketMu  sync.RWMutex
	groupSocketMap map[int64]map[string]struct{} // groupId → set of socketIds

	pingMu          sync.Mutex
	pingTrackingSet map[int64]struct{} // userId set; swapped atomically on flush

	channelsMu   sync.RWMutex
	userChannels map[int64]map[int64]struct{} // userId → set of channelIds

	groupsMu   sync.RWMutex
	userGroups map[int64]map[int64]struct{} // userId → set of groupIds

	channelRefMu    sync.RWMutex
	channelRefCount map[int64]int // channelId → subscriber count

	groupRefMu    sync.RWMutex
	groupRefCount map[int64]int // groupId → subscriber count
}

// NewChatsStore creates an initialised ChatsStore.
func NewChatsStore() *ChatsStore {
	return &ChatsStore{
		userSocketMap:   make(map[int64]string),
		groupSocketMap:  make(map[int64]map[string]struct{}),
		pingTrackingSet: make(map[int64]struct{}),
		userChannels:    make(map[int64]map[int64]struct{}),
		userGroups:      make(map[int64]map[int64]struct{}),
		channelRefCount: make(map[int64]int),
		groupRefCount:   make(map[int64]int),
	}
}

// --- User ↔ socket mapping ---

func (s *ChatsStore) GetClient(userId int64) (string, bool) {
	s.userSocketMu.RLock()
	defer s.userSocketMu.RUnlock()
	id, ok := s.userSocketMap[userId]
	return id, ok
}

func (s *ChatsStore) SetClient(userId int64, socketId string) {
	s.userSocketMu.Lock()
	defer s.userSocketMu.Unlock()
	s.userSocketMap[userId] = socketId
}

func (s *ChatsStore) DeleteClient(userId int64) {
	s.userSocketMu.Lock()
	defer s.userSocketMu.Unlock()
	delete(s.userSocketMap, userId)
}

// --- Group socket sets ---

// GetSocketsInGroup returns a snapshot of socket IDs in the given group.
func (s *ChatsStore) GetSocketsInGroup(groupId int64) []string {
	s.groupSocketMu.RLock()
	defer s.groupSocketMu.RUnlock()
	set, ok := s.groupSocketMap[groupId]
	if !ok {
		return nil
	}
	result := make([]string, 0, len(set))
	for socketId := range set {
		result = append(result, socketId)
	}
	return result
}

func (s *ChatsStore) AddSocketToGroup(groupId int64, socketId string) {
	s.groupSocketMu.Lock()
	defer s.groupSocketMu.Unlock()
	if _, ok := s.groupSocketMap[groupId]; !ok {
		s.groupSocketMap[groupId] = make(map[string]struct{})
	}
	s.groupSocketMap[groupId][socketId] = struct{}{}
}

func (s *ChatsStore) RemoveSocketFromGroup(groupId int64, socketId string) {
	s.groupSocketMu.Lock()
	defer s.groupSocketMu.Unlock()
	if set, ok := s.groupSocketMap[groupId]; ok {
		delete(set, socketId)
		if len(set) == 0 {
			delete(s.groupSocketMap, groupId)
		}
	}
}

// --- Ping tracking ---

// TrackPing records that the user was active (sent a pong).
func (s *ChatsStore) TrackPing(userId int64) {
	s.pingMu.Lock()
	defer s.pingMu.Unlock()
	s.pingTrackingSet[userId] = struct{}{}
}

// GetAndClearPingTrackingSet atomically returns all tracked user IDs and resets
// the set to empty. Callers should flush the returned IDs to Memcached.
func (s *ChatsStore) GetAndClearPingTrackingSet() []int64 {
	s.pingMu.Lock()
	old := s.pingTrackingSet
	s.pingTrackingSet = make(map[int64]struct{})
	s.pingMu.Unlock()

	result := make([]int64, 0, len(old))
	for userId := range old {
		result = append(result, userId)
	}
	return result
}

// --- Channel and group subscriptions with reference counting ---

// AddUserChannels records the channel subscriptions for a user and increments
// the reference count for each channel.
func (s *ChatsStore) AddUserChannels(userId int64, channelIds []int64) {
	channels := make(map[int64]struct{}, len(channelIds))
	for _, id := range channelIds {
		channels[id] = struct{}{}
	}

	s.channelsMu.Lock()
	s.userChannels[userId] = channels
	s.channelsMu.Unlock()

	s.channelRefMu.Lock()
	for _, id := range channelIds {
		s.channelRefCount[id]++
	}
	s.channelRefMu.Unlock()
}

// AddUserGroups records the group subscriptions for a user and increments
// the reference count for each group.
func (s *ChatsStore) AddUserGroups(userId int64, groupIds []int64) {
	groups := make(map[int64]struct{}, len(groupIds))
	for _, id := range groupIds {
		groups[id] = struct{}{}
	}

	s.groupsMu.Lock()
	s.userGroups[userId] = groups
	s.groupsMu.Unlock()

	s.groupRefMu.Lock()
	for _, id := range groupIds {
		s.groupRefCount[id]++
	}
	s.groupRefMu.Unlock()
}

// RemoveUserChannelsAndGroups removes the user's channel and group subscriptions
// and decrements the corresponding reference counts. Returns the channel and
// group IDs that were removed so the caller can unbind AMQP routing keys
// for those that have no remaining subscribers.
func (s *ChatsStore) RemoveUserChannelsAndGroups(userId int64) (channelIds []int64, groupIds []int64) {
	s.channelsMu.Lock()
	if channels, ok := s.userChannels[userId]; ok {
		channelIds = make([]int64, 0, len(channels))
		for id := range channels {
			channelIds = append(channelIds, id)
		}
		delete(s.userChannels, userId)
	}
	s.channelsMu.Unlock()

	s.groupsMu.Lock()
	if groups, ok := s.userGroups[userId]; ok {
		groupIds = make([]int64, 0, len(groups))
		for id := range groups {
			groupIds = append(groupIds, id)
		}
		delete(s.userGroups, userId)
	}
	s.groupsMu.Unlock()

	if len(channelIds) > 0 {
		s.channelRefMu.Lock()
		for _, id := range channelIds {
			s.channelRefCount[id]--
			if s.channelRefCount[id] <= 0 {
				delete(s.channelRefCount, id)
			}
		}
		s.channelRefMu.Unlock()
	}

	if len(groupIds) > 0 {
		s.groupRefMu.Lock()
		for _, id := range groupIds {
			s.groupRefCount[id]--
			if s.groupRefCount[id] <= 0 {
				delete(s.groupRefCount, id)
			}
		}
		s.groupRefMu.Unlock()
	}

	return channelIds, groupIds
}

// HasChannelSubscribers reports whether any connected user is subscribed to the channel.
func (s *ChatsStore) HasChannelSubscribers(channelId int64) bool {
	s.channelRefMu.RLock()
	defer s.channelRefMu.RUnlock()
	return s.channelRefCount[channelId] > 0
}

// HasGroupSubscribers reports whether any connected user is subscribed to the group.
func (s *ChatsStore) HasGroupSubscribers(groupId int64) bool {
	s.groupRefMu.RLock()
	defer s.groupRefMu.RUnlock()
	return s.groupRefCount[groupId] > 0
}

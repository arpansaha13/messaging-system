package cache

// PresenceCache defines the interface for tracking user online status.
type PresenceCache interface {
	SetOnline(userId int64, ttl int32) error
	SetBatchOnline(userIds []int64, ttl int32) error
	GetBatchOnlineStatus(userIds []int64) (map[int64]bool, error)
}

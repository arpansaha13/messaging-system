package domain

import "time"

// MessageStatus represents the delivery status of a message
type MessageStatus int8

const (
	MessageStatusSent MessageStatus = iota + 1
	MessageStatusDelivered
	MessageStatusRead
)

// Now returns the current time
func Now() time.Time {
	return time.Now().UTC()
}

// UserProfile represents a user profile in the system
// The actual user data (email, username, etc.) is managed by the auth microservice
type UserProfile struct {
	ID         int64      `gorm:"primaryKey" json:"id"`
	GlobalName string     `gorm:"not null" json:"global_name"`
	DP         *string    `json:"dp"`
	Bio        string     `gorm:"default:'Hey there!'" json:"bio"`
	CreatedAt  time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt  *time.Time `json:"deleted_at,omitempty"`
}

// AuthUser represents user data from the auth microservice
// This is fetched from the auth service and stored in the request context
type AuthUser struct {
	UserID   int64  `json:"user_id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Verified bool   `json:"verified"`
}

// Message represents a message in a chat or group
type Message struct {
	ID        int64     `gorm:"primaryKey"`
	SenderID  int64     `gorm:"index"`
	ChannelID *int64    `gorm:"index"`
	Content   string    `gorm:"type:text"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
	DeletedAt *time.Time
}

// MessageRecipient represents delivery status of a message
type MessageRecipient struct {
	ID         int64         `gorm:"primaryKey" json:"id"`
	MessageID  int64         `gorm:"index" json:"message_id"`
	ReceiverID int64         `gorm:"index" json:"receiver_id"`
	Status     MessageStatus `gorm:"type:smallint;default:1" json:"status"`
	CreatedAt  time.Time     `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time     `gorm:"autoUpdateTime" json:"updated_at"`
}

// Chat represents a 1-to-1 chat between two users
type Chat struct {
	ID         int64 `gorm:"primaryKey"`
	SenderID   int64 `gorm:"index"`
	ReceiverID int64 `gorm:"index"`
	Muted      bool  `gorm:"default:false"`
	Pinned     bool  `gorm:"default:false"`
	Archived   bool  `gorm:"default:false"`
	ClearedAt  *time.Time
	CreatedAt  time.Time `gorm:"autoCreateTime"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime"`
	DeletedAt  *time.Time
}

// Channel represents a channel in a group (similar to Discord channels)
type Channel struct {
	ID        int64      `gorm:"primaryKey" json:"id"`
	Name      string     `gorm:"not null" json:"name"`
	GroupID   int64      `gorm:"not null;index" json:"group_id"`
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

// Contact represents a contact relationship between users
type Contact struct {
	ID              int64     `gorm:"primaryKey"`
	UserID          int64     `gorm:"index"`
	UserIDInContact int64     `gorm:"index"`
	Alias           string    `gorm:"default:''"`
	CreatedAt       time.Time `gorm:"autoCreateTime"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime"`
	DeletedAt       *time.Time
}

// Group represents a group chat
type Group struct {
	ID        int64     `gorm:"primaryKey"`
	Name      string    `gorm:"not null"`
	FounderID int64     `gorm:"not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
	DeletedAt *time.Time
}

// UserGroup represents membership in a group
type UserGroup struct {
	ID        int64     `gorm:"primaryKey"`
	UserID    int64     `gorm:"index"`
	GroupID   int64     `gorm:"index"`
	Role      string    `gorm:"default:'member'"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
	DeletedAt *time.Time
}

// Invite represents an invitation to join a group
type Invite struct {
	Hash      string     `gorm:"primaryKey" json:"hash"`
	InviterID int64      `gorm:"index"`
	GroupID   *int64     `gorm:"index"`
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	ExpiresAt *time.Time `json:"expires_at"`
	Group     *Group     `gorm:"foreignKey:GroupID;references:ID" json:"group,omitempty"`
}

// RequestContext holds request context with authenticated user info
type RequestContext struct {
	UserID   int64
	AuthUser *AuthUser
}

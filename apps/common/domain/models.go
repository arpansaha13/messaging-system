package domain

import "time"

// MessageStatus represents the status of a message delivery
type MessageStatus int8

const (
	MessageStatusSent MessageStatus = iota + 1
	MessageStatusDelivered
	MessageStatusRead
)

// Now returns the current time in UTC
func Now() time.Time {
	return time.Now().UTC()
}

// AuthUser represents user data from the auth microservice
// This is fetched from the auth service and stored in the request context
type AuthUser struct {
	UserID   int64  `json:"user_id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Verified bool   `json:"verified"`
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

// Message represents a message in a chat or group
type Message struct {
	ID        int64 `gorm:"primaryKey"`
	SenderID  int64 `gorm:"index"`
	Sender    *UserProfile `gorm:"-"`
	ChannelID *int64 `gorm:"index"` // Null for personal messages
	Channel   *Channel
	Content   string    `gorm:"type:text"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
	DeletedAt *time.Time
}

// MessageRecipient tracks delivery status of a message to a recipient
type MessageRecipient struct {
	ID         int64 `gorm:"primaryKey" json:"id"`
	MessageID  int64 `gorm:"index" json:"message_id"`
	Message    *Message
	ReceiverID int64 `gorm:"index" json:"receiver_id"`
	Receiver   *UserProfile `gorm:"-"`
	Status     MessageStatus `gorm:"type:smallint;default:1" json:"status"`
	CreatedAt  time.Time     `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time     `gorm:"autoUpdateTime" json:"updated_at"`
}

// Chat represents a 1-to-1 chat between two users
type Chat struct {
	ID         int64 `gorm:"primaryKey"`
	SenderID   int64 `gorm:"index"`
	Sender     *UserProfile `gorm:"-"`
	ReceiverID int64 `gorm:"index"`
	Receiver   *UserProfile `gorm:"-"`
	Muted      bool `gorm:"default:false"`
	Pinned     bool `gorm:"default:false"`
	Archived   bool `gorm:"default:false"`
	ClearedAt  *time.Time
	CreatedAt  time.Time `gorm:"autoCreateTime"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime"`
	DeletedAt  *time.Time
}

// Channel represents a channel in a group
type Channel struct {
	ID        int64  `gorm:"primaryKey" json:"id"`
	Name      string `gorm:"not null" json:"name"`
	GroupID   int64  `gorm:"not null;index" json:"group_id"`
	Group     *Group
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

// Contact represents a contact relationship between users
type Contact struct {
	ID              int64 `gorm:"primaryKey"`
	UserID          int64 `gorm:"index"`
	User            *UserProfile `gorm:"-"`
	UserIDInContact int64        `gorm:"index"`
	ContactUser     *UserProfile `gorm:"-"`
	Alias           string       `gorm:"default:''"`
	CreatedAt       time.Time    `gorm:"autoCreateTime"`
	UpdatedAt       time.Time    `gorm:"autoUpdateTime"`
	DeletedAt       *time.Time
}

// Group represents a group chat
type Group struct {
	ID        int64  `gorm:"primaryKey"`
	Name      string `gorm:"not null"`
	FounderID int64  `gorm:"not null"`
	Founder   *UserProfile `gorm:"-"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
	DeletedAt *time.Time
}

// UserGroup represents membership in a group
type UserGroup struct {
	ID        int64        `gorm:"primaryKey"`
	UserID    int64        `gorm:"index"`
	User      *UserProfile `gorm:"-"`
	GroupID   int64        `gorm:"index"`
	Group     *Group
	Role      string    `gorm:"default:'member'"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
	DeletedAt *time.Time
}

// Invite represents an invitation to join a group
type Invite struct {
	Hash      string `gorm:"primaryKey" json:"hash"`
	InviterID int64  `gorm:"index"`
	Inviter   *UserProfile `gorm:"-"`
	GroupID   *int64     `gorm:"index"`
	Group     *Group     `gorm:"foreignKey:GroupID;references:ID"`
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	ExpiresAt *time.Time `json:"expires_at"`
}

// RequestContext holds request context with authenticated user info
type RequestContext struct {
	UserID   int64
	AuthUser *AuthUser
}

// TableName specifies the table name for each model
func (UserProfile) TableName() string      { return "user_profiles" }
func (Message) TableName() string          { return "messages" }
func (MessageRecipient) TableName() string { return "message_recipients" }
func (Chat) TableName() string             { return "chats" }
func (Group) TableName() string            { return "groups" }
func (Channel) TableName() string          { return "channels" }
func (UserGroup) TableName() string        { return "user_groups" }
func (Contact) TableName() string          { return "contacts" }
func (Invite) TableName() string           { return "invites" }

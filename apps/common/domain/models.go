package domain

import "time"

// MessageStatus represents the status of a message delivery
type MessageStatus int

const (
	MessageStatusSent      MessageStatus = 1
	MessageStatusDelivered MessageStatus = 2
	MessageStatusRead      MessageStatus = 3
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

// UserProfile represents a user in the system
type UserProfile struct {
	ID         int64   `gorm:"primaryKey"`
	GlobalName string  `gorm:"not null"`
	DP         *string // Display picture URL
	Bio        string  `gorm:"default:'Hey there!'"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	DeletedAt  *time.Time `gorm:"index"`
}

// Message represents a message sent by a user
type Message struct {
	ID        int64 `gorm:"primaryKey"`
	SenderID  int64 `gorm:"index"`
	Sender    *UserProfile
	ChannelID *int64 `gorm:"index"` // Null for personal messages
	Channel   *Channel
	Content   string
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time `gorm:"index"`
}

// MessageRecipient tracks delivery status of a message to a recipient
type MessageRecipient struct {
	ID         int64 `gorm:"primaryKey"`
	MessageID  int64 `gorm:"index"`
	Message    *Message
	ReceiverID int64 `gorm:"index"`
	Receiver   *UserProfile
	Status     MessageStatus `gorm:"type:smallint"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// Chat represents a 1-to-1 direct chat between two users
type Chat struct {
	ID         int64 `gorm:"primaryKey"`
	SenderID   int64 `gorm:"index"`
	Sender     *UserProfile
	ReceiverID int64 `gorm:"index"`
	Receiver   *UserProfile
	Muted      bool `gorm:"default:false"`
	Pinned     bool `gorm:"default:false"`
	Archived   bool `gorm:"default:false"`
	ClearedAt  *time.Time
	CreatedAt  time.Time
	UpdatedAt  time.Time
	DeletedAt  *time.Time `gorm:"index"`
}

// Group represents a group chat
type Group struct {
	ID        int64  `gorm:"primaryKey"`
	Name      string `gorm:"not null"`
	FounderID int64
	Founder   *UserProfile
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time `gorm:"index"`
}

// Channel represents a channel within a group
type Channel struct {
	ID        int64  `gorm:"primaryKey"`
	Name      string `gorm:"not null"`
	GroupID   int64  `gorm:"index"`
	Group     *Group
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time `gorm:"index"`
}

// UserGroup represents membership of a user in a group
type UserGroup struct {
	ID        int64 `gorm:"primaryKey"`
	UserID    int64 `gorm:"index"`
	User      *UserProfile
	GroupID   int64 `gorm:"index"`
	Group     *Group
	Role      string `gorm:"default:'member'"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time `gorm:"index"`
}

// Contact represents a contact relationship between users
type Contact struct {
	ID              int64 `gorm:"primaryKey"`
	UserID          int64 `gorm:"index"`
	User            *UserProfile
	UserIDInContact int64        `gorm:"index"`
	ContactUser     *UserProfile `gorm:"foreignKey:UserIDInContact"`
	Alias           string       `gorm:"default:''"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	DeletedAt       *time.Time `gorm:"index"`
}

// Invite represents a group invitation
type Invite struct {
	Hash      string `gorm:"primaryKey"`
	InviterID int64  `gorm:"index"`
	Inviter   *UserProfile
	GroupID   *int64 `gorm:"index"`
	Group     *Group
	CreatedAt time.Time
	UpdatedAt time.Time
	ExpiresAt *time.Time
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

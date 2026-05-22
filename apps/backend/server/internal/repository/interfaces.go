package repository

import (
	"context"
	"time"

	domain "github.com/arpansaha13/messaging-system/apps/common/domain"
	"gorm.io/gorm"
)

// ChatRepository defines the interface for chat repository operations
type IChatRepository interface {
	Create(ctx context.Context, chat *domain.Chat) error
	FirstOrCreate(ctx context.Context, tx *gorm.DB, chat *domain.Chat) error
	GetByID(ctx context.Context, chatID int64) (*domain.Chat, error)
	GetByUsers(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error)
	GetUserChatsByArchived(ctx context.Context, userID int64, archived bool) ([]*domain.Chat, error)
	Delete(ctx context.Context, chatID int64) error
	Update(ctx context.Context, chat *domain.Chat) error
}

// MessageRepository defines the interface for message repository operations
type IMessageRepository interface {
	Create(ctx context.Context, tx *gorm.DB, message *domain.Message) error
	GetByID(ctx context.Context, messageID int64) (*domain.Message, error)
	GetByIDs(ctx context.Context, ids []int64) ([]*domain.Message, error)
	GetMessagesByUserId(ctx context.Context, senderID, receiverID int64, clearedAt *time.Time, before, after *int64) (*MessagePage, error)
	Delete(ctx context.Context, messageID int64) error
	Update(ctx context.Context, message *domain.Message) error
	GetLatestMessageByUsersInChat(ctx context.Context, userID, receiverID int64, clearedAt *time.Time) (*MessageWithStatus, error)
	GetMessagesByChannelID(ctx context.Context, channelID int64, before, after *int64) (*ChannelMessagePage, error)
	Transaction(ctx context.Context, fn func(tx *gorm.DB) error) error
}

// MessageRecipientRepository defines the interface for message recipient repository operations
type IMessageRecipientRepository interface {
	Create(ctx context.Context, tx *gorm.DB, recipient *domain.MessageRecipient) error
	GetByID(ctx context.Context, recipientID int64) (*domain.MessageRecipient, error)
	GetByMessageAndReceiver(ctx context.Context, messageID, receiverID int64) (*domain.MessageRecipient, error)
	GetByMessageIDsAndReceiver(ctx context.Context, messageIDs []int64, receiverID int64) ([]*domain.MessageRecipient, error)
	GetByMessageID(ctx context.Context, messageID int64) ([]*domain.MessageRecipient, error)
	UpdateStatus(ctx context.Context, recipientID int64, status domain.MessageStatus) error
	UpdateStatusByMessageAndReceiver(ctx context.Context, messageID, receiverID int64, status domain.MessageStatus) error
	Delete(ctx context.Context, recipientID int64) error
}

// ChannelRepository defines the interface for channel repository operations
type IChannelRepository interface {
	Create(ctx context.Context, channel *domain.Channel) error
	GetByID(ctx context.Context, userID, channelID int64) (*domain.Channel, error)
	GetByIDUnscoped(ctx context.Context, tx *gorm.DB, channelID int64) (*domain.Channel, error)
	GetAll(ctx context.Context, userID int64) ([]*domain.Channel, error)
	GetByGroupID(ctx context.Context, userID, groupID int64) ([]*domain.Channel, error)
}

// GroupRepository defines the interface for group repository operations
type IGroupRepository interface {
	Create(ctx context.Context, group *domain.Group) error
	GetByIDUnscoped(ctx context.Context, groupID int64) (*domain.Group, error)
	GetByID(ctx context.Context, userID, groupID int64) (*domain.Group, error)
	GetAll(ctx context.Context, userID int64) ([]*domain.Group, error)
}

// InviteRepository defines the interface for invite repository operations
type IInviteRepository interface {
	Create(ctx context.Context, invite *domain.Invite) error
	GetByHash(ctx context.Context, hash string) (*domain.Invite, error)
	GetByHashWithGroup(ctx context.Context, hash string) (*domain.Invite, error)
	Delete(ctx context.Context, hash string) error
	Update(ctx context.Context, invite *domain.Invite) error
}

// UserGroupRepository defines the interface for user group repository operations
type IUserGroupRepository interface {
	Create(ctx context.Context, userGroup *domain.UserGroup) error
	GetGroupMembers(ctx context.Context, userID, groupID int64) ([]*domain.UserGroup, error)
	GetGroupMembersExceptSender(ctx context.Context, tx *gorm.DB, groupID, senderID int64) ([]*domain.UserGroup, error)
	Exists(ctx context.Context, userID, groupID int64) (bool, error)
}

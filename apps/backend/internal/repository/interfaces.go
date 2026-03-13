package repository

import (
	"context"
	"time"

	domain "github.com/arpansaha13/messaging-system/apps/common/domain"
)

// UserRepository defines the interface for user repository operations
type IUserRepository interface {
	GetByID(ctx context.Context, userID int64) (*domain.UserProfile, error)
	Create(ctx context.Context, userProfile *domain.UserProfile) error
	Update(ctx context.Context, userProfile *domain.UserProfile) error
	Delete(ctx context.Context, userID int64) error
	Search(ctx context.Context, query string, limit int) ([]*domain.UserProfile, error)
}

// ContactRepository defines the interface for contact repository operations
type IContactRepository interface {
	Create(ctx context.Context, contact *domain.Contact) error
	GetByID(ctx context.Context, contactID int64) (*domain.Contact, error)
	GetUserContacts(ctx context.Context, userID int64) ([]*ContactWithUserInfo, error)
	Exists(ctx context.Context, userID, contactID int64) (bool, error)
	UpdateAlias(ctx context.Context, contactID int64, alias string) error
	Delete(ctx context.Context, contactID int64) error
	GetContactByUserIds(ctx context.Context, userID, contactUserID int64) (*domain.Contact, error)
}

// ChatRepository defines the interface for chat repository operations
type IChatRepository interface {
	Create(ctx context.Context, chat *domain.Chat) error
	GetByID(ctx context.Context, chatID int64) (*domain.Chat, error)
	GetByUsers(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error)
	GetUserChatsByArchived(ctx context.Context, userID int64, archived bool) ([]*ChatWithReceiverInfo, error)
	Delete(ctx context.Context, chatID int64) error
	Update(ctx context.Context, chat *domain.Chat) error
}

// MessageRepository defines the interface for message repository operations
type IMessageRepository interface {
	Create(ctx context.Context, message *domain.Message) error
	GetByID(ctx context.Context, messageID int64) (*domain.Message, error)
	GetMessagesByUserId(ctx context.Context, senderID, receiverID int64, clearedAt *time.Time, before, after *int64) (*MessagePage, error)
	Delete(ctx context.Context, messageID int64) error
	Update(ctx context.Context, message *domain.Message) error
	GetLatestMessageByUsersInChat(ctx context.Context, userID, receiverID int64, clearedAt *time.Time) (*MessageWithStatus, error)
	GetMessagesByChannelID(ctx context.Context, channelID int64, before, after *int64) (*ChannelMessagePage, error)
}

// MessageRecipientRepository defines the interface for message recipient repository operations
type IMessageRecipientRepository interface {
	Create(ctx context.Context, recipient *domain.MessageRecipient) error
	GetByID(ctx context.Context, recipientID int64) (*domain.MessageRecipient, error)
	GetByMessageAndReceiver(ctx context.Context, messageID, receiverID int64) (*domain.MessageRecipient, error)
	GetByMessageID(ctx context.Context, messageID int64) ([]*domain.MessageRecipient, error)
	UpdateStatus(ctx context.Context, recipientID int64, status domain.MessageStatus) error
	UpdateStatusByMessageAndReceiver(ctx context.Context, messageID, receiverID int64, status domain.MessageStatus) error
	Delete(ctx context.Context, recipientID int64) error
}

// ChannelRepository defines the interface for channel repository operations
type IChannelRepository interface {
	Create(ctx context.Context, channel *domain.Channel) error
	GetByID(ctx context.Context, channelID int64) (*domain.Channel, error)
	GetAll(ctx context.Context) ([]*domain.Channel, error)
	GetByGroupID(ctx context.Context, groupID int64) ([]*domain.Channel, error)
	Delete(ctx context.Context, channelID int64) error
	Update(ctx context.Context, channel *domain.Channel) error
}

// GroupRepository defines the interface for group repository operations
type IGroupRepository interface {
	Create(ctx context.Context, group *domain.Group) error
	GetByID(ctx context.Context, groupID int64) (*domain.Group, error)
	GetAll(ctx context.Context) ([]*domain.Group, error)
	Delete(ctx context.Context, groupID int64) error
	Update(ctx context.Context, group *domain.Group) error
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
	GetByID(ctx context.Context, userGroupID int64) (*domain.UserGroup, error)
	GetGroupMembers(ctx context.Context, groupID int64) ([]*domain.UserGroup, error)
	GetUserGroups(ctx context.Context, userID int64) ([]*domain.UserGroup, error)
	Exists(ctx context.Context, userID, groupID int64) (bool, error)
	Delete(ctx context.Context, userGroupID int64) error
	Update(ctx context.Context, userGroup *domain.UserGroup) error
}

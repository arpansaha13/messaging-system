package mocks

import (
	"context"
	"time"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// MockUserRepository is a mock implementation of IUserRepository
type MockUserRepository struct {
	GetByIDFunc func(ctx context.Context, id int64) (*domain.UserProfile, error)
	CreateFunc  func(ctx context.Context, user *domain.UserProfile) error
	UpdateFunc  func(ctx context.Context, user *domain.UserProfile) error
	DeleteFunc  func(ctx context.Context, id int64) error
	SearchFunc  func(ctx context.Context, query string, limit int) ([]*domain.UserProfile, error)
}

func (m *MockUserRepository) GetByID(ctx context.Context, id int64) (*domain.UserProfile, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(ctx, id)
	}
	return nil, nil
}

func (m *MockUserRepository) Create(ctx context.Context, user *domain.UserProfile) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, user)
	}
	return nil
}

func (m *MockUserRepository) Update(ctx context.Context, user *domain.UserProfile) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, user)
	}
	return nil
}

func (m *MockUserRepository) Delete(ctx context.Context, id int64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, id)
	}
	return nil
}

func (m *MockUserRepository) Search(ctx context.Context, query string, limit int) ([]*domain.UserProfile, error) {
	if m.SearchFunc != nil {
		return m.SearchFunc(ctx, query, limit)
	}
	return nil, nil
}

// MockContactRepository is a mock implementation of IContactRepository
type MockContactRepository struct {
	GetContactByUserIdsFunc    func(ctx context.Context, userID1, userID2 int64) (*domain.Contact, error)
	CreateFunc                 func(ctx context.Context, contact *domain.Contact) error
	GetAllFunc                 func(ctx context.Context, userID int64) ([]*domain.Contact, error)
	DeleteFunc                 func(ctx context.Context, contactID int64) error
	ExistsFunc                 func(ctx context.Context, userID, contactID int64) (bool, error)
	GetContactWithUserInfoFunc func(ctx context.Context, userID int64) (any, error)
	GetByIDFunc                func(ctx context.Context, contactID int64) (*domain.Contact, error)
	GetUserContactsFunc        func(ctx context.Context, userID int64) ([]*repository.ContactWithUserInfo, error)
}

func (m *MockContactRepository) GetContactByUserIds(ctx context.Context, userID1, userID2 int64) (*domain.Contact, error) {
	if m.GetContactByUserIdsFunc != nil {
		return m.GetContactByUserIdsFunc(ctx, userID1, userID2)
	}
	return nil, nil
}

func (m *MockContactRepository) Create(ctx context.Context, contact *domain.Contact) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, contact)
	}
	return nil
}

func (m *MockContactRepository) GetAll(ctx context.Context, userID int64) ([]*domain.Contact, error) {
	if m.GetAllFunc != nil {
		return m.GetAllFunc(ctx, userID)
	}
	return nil, nil
}

func (m *MockContactRepository) Delete(ctx context.Context, contactID int64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, contactID)
	}
	return nil
}

func (m *MockContactRepository) Exists(ctx context.Context, userID, contactID int64) (bool, error) {
	if m.ExistsFunc != nil {
		return m.ExistsFunc(ctx, userID, contactID)
	}
	return false, nil
}

func (m *MockContactRepository) GetAllWithUserInfo(ctx context.Context, userID int64) (any, error) {
	if m.GetContactWithUserInfoFunc != nil {
		return m.GetContactWithUserInfoFunc(ctx, userID)
	}
	return nil, nil
}

func (m *MockContactRepository) GetByID(ctx context.Context, contactID int64) (*domain.Contact, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(ctx, contactID)
	}
	return nil, nil
}

func (m *MockContactRepository) GetUserContacts(ctx context.Context, userID int64) ([]*repository.ContactWithUserInfo, error) {
	if m.GetUserContactsFunc != nil {
		return m.GetUserContactsFunc(ctx, userID)
	}
	return nil, nil
}

// MockGroupRepository is a mock implementation of IGroupRepository
type MockGroupRepository struct {
	GetByIDFunc func(ctx context.Context, id int64) (*domain.Group, error)
	CreateFunc  func(ctx context.Context, group *domain.Group) error
	GetAllFunc  func(ctx context.Context) ([]*domain.Group, error)
	DeleteFunc  func(ctx context.Context, id int64) error
	UpdateFunc  func(ctx context.Context, group *domain.Group) error
}

func (m *MockGroupRepository) GetByID(ctx context.Context, id int64) (*domain.Group, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(ctx, id)
	}
	return nil, nil
}

func (m *MockGroupRepository) Create(ctx context.Context, group *domain.Group) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, group)
	}
	return nil
}

func (m *MockGroupRepository) GetAll(ctx context.Context) ([]*domain.Group, error) {
	if m.GetAllFunc != nil {
		return m.GetAllFunc(ctx)
	}
	return nil, nil
}

func (m *MockGroupRepository) Delete(ctx context.Context, id int64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, id)
	}
	return nil
}

func (m *MockGroupRepository) Update(ctx context.Context, group *domain.Group) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, group)
	}
	return nil
}

// MockChannelRepository is a mock implementation of IChannelRepository
type MockChannelRepository struct {
	GetByIDFunc      func(ctx context.Context, id int64) (*domain.Channel, error)
	CreateFunc       func(ctx context.Context, channel *domain.Channel) error
	GetAllFunc       func(ctx context.Context) ([]*domain.Channel, error)
	GetByGroupIDFunc func(ctx context.Context, groupID int64) ([]*domain.Channel, error)
	DeleteFunc       func(ctx context.Context, id int64) error
	UpdateFunc       func(ctx context.Context, channel *domain.Channel) error
}

func (m *MockChannelRepository) GetByID(ctx context.Context, id int64) (*domain.Channel, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(ctx, id)
	}
	return nil, nil
}

func (m *MockChannelRepository) Create(ctx context.Context, channel *domain.Channel) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, channel)
	}
	return nil
}

func (m *MockChannelRepository) GetAll(ctx context.Context) ([]*domain.Channel, error) {
	if m.GetAllFunc != nil {
		return m.GetAllFunc(ctx)
	}
	return nil, nil
}

func (m *MockChannelRepository) GetByGroupID(ctx context.Context, groupID int64) ([]*domain.Channel, error) {
	if m.GetByGroupIDFunc != nil {
		return m.GetByGroupIDFunc(ctx, groupID)
	}
	return nil, nil
}

func (m *MockChannelRepository) Delete(ctx context.Context, id int64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, id)
	}
	return nil
}

func (m *MockChannelRepository) Update(ctx context.Context, channel *domain.Channel) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, channel)
	}
	return nil
}

// MockChatRepository is a mock implementation of IChatRepository
type MockChatRepository struct {
	CreateFunc       func(ctx context.Context, chat *domain.Chat) error
	GetByIDFunc      func(ctx context.Context, chatID int64) (*domain.Chat, error)
	GetByUsersFunc   func(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error)
	GetUserChatsFunc func(ctx context.Context, userID int64) ([]*repository.ChatWithReceiverInfo, error)
	UpdateFunc       func(ctx context.Context, chat *domain.Chat) error
	DeleteFunc       func(ctx context.Context, chatID int64) error
}

func (m *MockChatRepository) Create(ctx context.Context, chat *domain.Chat) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, chat)
	}
	return nil
}

func (m *MockChatRepository) GetByID(ctx context.Context, chatID int64) (*domain.Chat, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(ctx, chatID)
	}
	return nil, nil
}

func (m *MockChatRepository) GetByUsers(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error) {
	if m.GetByUsersFunc != nil {
		return m.GetByUsersFunc(ctx, user1ID, user2ID)
	}
	return nil, nil
}

func (m *MockChatRepository) GetUserChats(ctx context.Context, userID int64) ([]*repository.ChatWithReceiverInfo, error) {
	if m.GetUserChatsFunc != nil {
		return m.GetUserChatsFunc(ctx, userID)
	}
	return nil, nil
}

func (m *MockChatRepository) Update(ctx context.Context, chat *domain.Chat) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, chat)
	}
	return nil
}

func (m *MockChatRepository) Delete(ctx context.Context, chatID int64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, chatID)
	}
	return nil
}

// MockUserGroupRepository is a mock implementation of IUserGroupRepository
type MockUserGroupRepository struct {
	CreateFunc          func(ctx context.Context, userGroup *domain.UserGroup) error
	GetByIDFunc         func(ctx context.Context, userGroupID int64) (*domain.UserGroup, error)
	GetGroupMembersFunc func(ctx context.Context, groupID int64) ([]*domain.UserGroup, error)
	GetUserGroupsFunc   func(ctx context.Context, userID int64) ([]*domain.UserGroup, error)
	ExistsFunc          func(ctx context.Context, userID, groupID int64) (bool, error)
	DeleteFunc          func(ctx context.Context, userGroupID int64) error
	UpdateFunc          func(ctx context.Context, userGroup *domain.UserGroup) error
}

func (m *MockUserGroupRepository) Create(ctx context.Context, userGroup *domain.UserGroup) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, userGroup)
	}
	return nil
}

func (m *MockUserGroupRepository) GetByID(ctx context.Context, userGroupID int64) (*domain.UserGroup, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(ctx, userGroupID)
	}
	return nil, nil
}

func (m *MockUserGroupRepository) GetGroupMembers(ctx context.Context, groupID int64) ([]*domain.UserGroup, error) {
	if m.GetGroupMembersFunc != nil {
		return m.GetGroupMembersFunc(ctx, groupID)
	}
	return nil, nil
}

func (m *MockUserGroupRepository) GetUserGroups(ctx context.Context, userID int64) ([]*domain.UserGroup, error) {
	if m.GetUserGroupsFunc != nil {
		return m.GetUserGroupsFunc(ctx, userID)
	}
	return nil, nil
}

func (m *MockUserGroupRepository) Exists(ctx context.Context, userID, groupID int64) (bool, error) {
	if m.ExistsFunc != nil {
		return m.ExistsFunc(ctx, userID, groupID)
	}
	return false, nil
}

func (m *MockUserGroupRepository) Delete(ctx context.Context, userGroupID int64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, userGroupID)
	}
	return nil
}

func (m *MockUserGroupRepository) Update(ctx context.Context, userGroup *domain.UserGroup) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, userGroup)
	}
	return nil
}

// MockMessageRecipientRepository is a mock implementation of IMessageRecipientRepository
type MockMessageRecipientRepository struct {
	CreateFunc                           func(ctx context.Context, recipient *domain.MessageRecipient) error
	GetByIDFunc                          func(ctx context.Context, recipientID int64) (*domain.MessageRecipient, error)
	GetByMessageAndReceiverFunc          func(ctx context.Context, messageID, receiverID int64) (*domain.MessageRecipient, error)
	GetByMessageIDFunc                   func(ctx context.Context, messageID int64) ([]*domain.MessageRecipient, error)
	UpdateStatusFunc                     func(ctx context.Context, recipientID int64, status domain.MessageStatus) error
	UpdateStatusByMessageAndReceiverFunc func(ctx context.Context, messageID, receiverID int64, status domain.MessageStatus) error
	DeleteFunc                           func(ctx context.Context, recipientID int64) error
}

func (m *MockMessageRecipientRepository) Create(ctx context.Context, recipient *domain.MessageRecipient) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, recipient)
	}
	return nil
}

func (m *MockMessageRecipientRepository) GetByID(ctx context.Context, recipientID int64) (*domain.MessageRecipient, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(ctx, recipientID)
	}
	return nil, nil
}

func (m *MockMessageRecipientRepository) GetByMessageAndReceiver(ctx context.Context, messageID, receiverID int64) (*domain.MessageRecipient, error) {
	if m.GetByMessageAndReceiverFunc != nil {
		return m.GetByMessageAndReceiverFunc(ctx, messageID, receiverID)
	}
	return nil, nil
}

func (m *MockMessageRecipientRepository) GetByMessageID(ctx context.Context, messageID int64) ([]*domain.MessageRecipient, error) {
	if m.GetByMessageIDFunc != nil {
		return m.GetByMessageIDFunc(ctx, messageID)
	}
	return nil, nil
}

func (m *MockMessageRecipientRepository) UpdateStatus(ctx context.Context, recipientID int64, status domain.MessageStatus) error {
	if m.UpdateStatusFunc != nil {
		return m.UpdateStatusFunc(ctx, recipientID, status)
	}
	return nil
}

func (m *MockMessageRecipientRepository) UpdateStatusByMessageAndReceiver(ctx context.Context, messageID, receiverID int64, status domain.MessageStatus) error {
	if m.UpdateStatusByMessageAndReceiverFunc != nil {
		return m.UpdateStatusByMessageAndReceiverFunc(ctx, messageID, receiverID, status)
	}
	return nil
}

func (m *MockMessageRecipientRepository) Delete(ctx context.Context, recipientID int64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, recipientID)
	}
	return nil
}

// MockMessageRepository is a mock implementation of IMessageRepository
type MockMessageRepository struct {
	CreateFunc                        func(ctx context.Context, message *domain.Message) error
	GetByIDFunc                       func(ctx context.Context, messageID int64) (*domain.Message, error)
	GetMessagesByUserIdFunc           func(ctx context.Context, senderID, receiverID int64, clearedAt *time.Time, before, after *int64) (*repository.MessagePage, error)
	GetLatestMessageByUsersInChatFunc func(ctx context.Context, userID, receiverID int64, clearedAt *time.Time) (*repository.MessageWithStatus, error)
	GetMessagesByChannelIDFunc        func(ctx context.Context, channelID int64, before, after *int64) (*repository.ChannelMessagePage, error)
	UpdateFunc                        func(ctx context.Context, message *domain.Message) error
	DeleteFunc                        func(ctx context.Context, messageID int64) error
}

func (m *MockMessageRepository) Create(ctx context.Context, message *domain.Message) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, message)
	}
	return nil
}

func (m *MockMessageRepository) GetByID(ctx context.Context, messageID int64) (*domain.Message, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(ctx, messageID)
	}
	return nil, nil
}

func (m *MockMessageRepository) GetMessagesByUserId(ctx context.Context, senderID, receiverID int64, clearedAt *time.Time, before, after *int64) (*repository.MessagePage, error) {
	if m.GetMessagesByUserIdFunc != nil {
		return m.GetMessagesByUserIdFunc(ctx, senderID, receiverID, clearedAt, before, after)
	}
	return nil, nil
}

func (m *MockMessageRepository) GetLatestMessageByUsersInChat(ctx context.Context, userID, receiverID int64, clearedAt *time.Time) (*repository.MessageWithStatus, error) {
	if m.GetLatestMessageByUsersInChatFunc != nil {
		return m.GetLatestMessageByUsersInChatFunc(ctx, userID, receiverID, clearedAt)
	}
	return nil, nil
}

func (m *MockMessageRepository) GetMessagesByChannelID(ctx context.Context, channelID int64, before, after *int64) (*repository.ChannelMessagePage, error) {
	if m.GetMessagesByChannelIDFunc != nil {
		return m.GetMessagesByChannelIDFunc(ctx, channelID, before, after)
	}
	return nil, nil
}

func (m *MockMessageRepository) Update(ctx context.Context, message *domain.Message) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, message)
	}
	return nil
}

func (m *MockMessageRepository) Delete(ctx context.Context, messageID int64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, messageID)
	}
	return nil
}

// MockInviteRepository is a mock implementation of IInviteRepository
type MockInviteRepository struct {
	CreateFunc             func(ctx context.Context, invite *domain.Invite) error
	GetByHashFunc          func(ctx context.Context, hash string) (*domain.Invite, error)
	GetByHashWithGroupFunc func(ctx context.Context, hash string) (*domain.Invite, error)
	UpdateFunc             func(ctx context.Context, invite *domain.Invite) error
	DeleteFunc             func(ctx context.Context, hash string) error
}

func (m *MockInviteRepository) Create(ctx context.Context, invite *domain.Invite) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, invite)
	}
	return nil
}

func (m *MockInviteRepository) GetByHash(ctx context.Context, hash string) (*domain.Invite, error) {
	if m.GetByHashFunc != nil {
		return m.GetByHashFunc(ctx, hash)
	}
	return nil, nil
}

func (m *MockInviteRepository) GetByHashWithGroup(ctx context.Context, hash string) (*domain.Invite, error) {
	if m.GetByHashWithGroupFunc != nil {
		return m.GetByHashWithGroupFunc(ctx, hash)
	}
	return nil, nil
}

func (m *MockInviteRepository) Update(ctx context.Context, invite *domain.Invite) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, invite)
	}
	return nil
}

func (m *MockInviteRepository) Delete(ctx context.Context, hash string) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, hash)
	}
	return nil
}

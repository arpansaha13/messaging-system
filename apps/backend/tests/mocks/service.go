package mocks

import (
	"context"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// MockContactService is a mock implementation of IContactService
type MockContactService struct {
	AddContactFunc  func(ctx context.Context, userID, userIDInContact int64) (*domain.Contact, error)
	GetContactsFunc func(ctx context.Context, userID int64) ([]*repository.ContactWithUserInfo, error)
}

func (m *MockContactService) AddContact(ctx context.Context, userID, userIDInContact int64) (*domain.Contact, error) {
	if m.AddContactFunc != nil {
		return m.AddContactFunc(ctx, userID, userIDInContact)
	}
	return nil, nil
}

func (m *MockContactService) GetContacts(ctx context.Context, userID int64) ([]*repository.ContactWithUserInfo, error) {
	if m.GetContactsFunc != nil {
		return m.GetContactsFunc(ctx, userID)
	}
	return nil, nil
}

// MockGroupService is a mock implementation of IGroupService
type MockGroupService struct {
	CreateGroupFunc func(ctx context.Context, name string, founderID int64) (*domain.Group, error)
	GetGroupsFunc   func(ctx context.Context, userID int64) ([]*domain.Group, error)
}

func (m *MockGroupService) CreateGroup(ctx context.Context, name string, founderID int64) (*domain.Group, error) {
	if m.CreateGroupFunc != nil {
		return m.CreateGroupFunc(ctx, name, founderID)
	}
	return nil, nil
}

func (m *MockGroupService) GetGroups(ctx context.Context, userID int64) ([]*domain.Group, error) {
	if m.GetGroupsFunc != nil {
		return m.GetGroupsFunc(ctx, userID)
	}
	return nil, nil
}

// MockChannelService is a mock implementation of IChannelService
type MockChannelService struct {
	CreateChannelFunc        func(ctx context.Context, name string, groupID int64) (*domain.Channel, error)
	GetChannelsFunc          func(ctx context.Context) ([]*domain.Channel, error)
	GetChannelsByGroupIDFunc func(ctx context.Context, groupID int64) ([]*domain.Channel, error)
	GetChannelByIDFunc       func(ctx context.Context, channelID int64) (*domain.Channel, error)
}

func (m *MockChannelService) CreateChannel(ctx context.Context, name string, groupID int64) (*domain.Channel, error) {
	if m.CreateChannelFunc != nil {
		return m.CreateChannelFunc(ctx, name, groupID)
	}
	return nil, nil
}

func (m *MockChannelService) GetChannels(ctx context.Context) ([]*domain.Channel, error) {
	if m.GetChannelsFunc != nil {
		return m.GetChannelsFunc(ctx)
	}
	return nil, nil
}

func (m *MockChannelService) GetChannelsByGroupID(ctx context.Context, groupID int64) ([]*domain.Channel, error) {
	if m.GetChannelsByGroupIDFunc != nil {
		return m.GetChannelsByGroupIDFunc(ctx, groupID)
	}
	return nil, nil
}

func (m *MockChannelService) GetChannelByID(ctx context.Context, channelID int64) (*domain.Channel, error) {
	if m.GetChannelByIDFunc != nil {
		return m.GetChannelByIDFunc(ctx, channelID)
	}
	return nil, nil
}

// MockChatService is a mock implementation of IChatService
type MockChatService struct {
	CreateChatFunc    func(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error)
	GetUserChatsFunc  func(ctx context.Context, userID int64) (*service.ChatsResponseDTO, error)
	PinChatFunc       func(ctx context.Context, userID, receiverID int64) error
	UnpinChatFunc     func(ctx context.Context, userID, receiverID int64) error
	ArchiveChatFunc   func(ctx context.Context, userID, receiverID int64) error
	UnarchiveChatFunc func(ctx context.Context, userID, receiverID int64) error
	ClearChatFunc     func(ctx context.Context, userID, receiverID int64) error
	DeleteChatFunc    func(ctx context.Context, userID, receiverID int64) error
}

func (m *MockChatService) CreateChat(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error) {
	if m.CreateChatFunc != nil {
		return m.CreateChatFunc(ctx, user1ID, user2ID)
	}
	return nil, nil
}

func (m *MockChatService) GetUserChats(ctx context.Context, userID int64) (*service.ChatsResponseDTO, error) {
	if m.GetUserChatsFunc != nil {
		return m.GetUserChatsFunc(ctx, userID)
	}
	return nil, nil
}

func (m *MockChatService) PinChat(ctx context.Context, userID, receiverID int64) error {
	if m.PinChatFunc != nil {
		return m.PinChatFunc(ctx, userID, receiverID)
	}
	return nil
}

func (m *MockChatService) UnpinChat(ctx context.Context, userID, receiverID int64) error {
	if m.UnpinChatFunc != nil {
		return m.UnpinChatFunc(ctx, userID, receiverID)
	}
	return nil
}

func (m *MockChatService) ArchiveChat(ctx context.Context, userID, receiverID int64) error {
	if m.ArchiveChatFunc != nil {
		return m.ArchiveChatFunc(ctx, userID, receiverID)
	}
	return nil
}

func (m *MockChatService) UnarchiveChat(ctx context.Context, userID, receiverID int64) error {
	if m.UnarchiveChatFunc != nil {
		return m.UnarchiveChatFunc(ctx, userID, receiverID)
	}
	return nil
}

func (m *MockChatService) ClearChat(ctx context.Context, userID, receiverID int64) error {
	if m.ClearChatFunc != nil {
		return m.ClearChatFunc(ctx, userID, receiverID)
	}
	return nil
}

func (m *MockChatService) DeleteChat(ctx context.Context, userID, receiverID int64) error {
	if m.DeleteChatFunc != nil {
		return m.DeleteChatFunc(ctx, userID, receiverID)
	}
	return nil
}

// MockMessageService is a mock implementation of IMessageService
type MockMessageService struct {
	SendPersonalMessageFunc    func(ctx context.Context, senderID, receiverID int64, content, hash string) error
	SendGroupMessageFunc       func(ctx context.Context, senderID, groupID, channelID int64, content, hash string) error
	GetMessagesFunc            func(ctx context.Context, userID, receiverID int64, limit, offset int) ([]*repository.MessageWithStatus, error)
	MarkMessageAsDeliveredFunc func(ctx context.Context, messageID, receiverID, senderID int64) error
	MarkMessageAsReadFunc      func(ctx context.Context, messages []service.ReadPayload) error
	GetChannelMessagesFunc     func(ctx context.Context, channelID int64, limit, offset int) ([]*domain.Message, error)
}

func (m *MockMessageService) SendPersonalMessage(ctx context.Context, senderID, receiverID int64, content, hash string) error {
	if m.SendPersonalMessageFunc != nil {
		return m.SendPersonalMessageFunc(ctx, senderID, receiverID, content, hash)
	}
	return nil
}

func (m *MockMessageService) SendGroupMessage(ctx context.Context, senderID, groupID, channelID int64, content, hash string) error {
	if m.SendGroupMessageFunc != nil {
		return m.SendGroupMessageFunc(ctx, senderID, groupID, channelID, content, hash)
	}
	return nil
}

func (m *MockMessageService) GetMessages(ctx context.Context, userID, receiverID int64, limit, offset int) ([]*repository.MessageWithStatus, error) {
	if m.GetMessagesFunc != nil {
		return m.GetMessagesFunc(ctx, userID, receiverID, limit, offset)
	}
	return nil, nil
}

func (m *MockMessageService) MarkMessageAsDelivered(ctx context.Context, messageID, receiverID, senderID int64) error {
	if m.MarkMessageAsDeliveredFunc != nil {
		return m.MarkMessageAsDeliveredFunc(ctx, messageID, receiverID, senderID)
	}
	return nil
}

func (m *MockMessageService) MarkMessageAsRead(ctx context.Context, messages []service.ReadPayload) error {
	if m.MarkMessageAsReadFunc != nil {
		return m.MarkMessageAsReadFunc(ctx, messages)
	}
	return nil
}

func (m *MockMessageService) GetChannelMessages(ctx context.Context, channelID int64, limit, offset int) ([]*domain.Message, error) {
	if m.GetChannelMessagesFunc != nil {
		return m.GetChannelMessagesFunc(ctx, channelID, limit, offset)
	}
	return nil, nil
}

// MockInviteService is a mock implementation of IInviteService
type MockInviteService struct {
	CreateInviteFunc func(ctx context.Context, inviterID, groupID int64) (*domain.Invite, error)
	FindByHashFunc   func(ctx context.Context, hash string) (*domain.Invite, error)
	AcceptInviteFunc func(ctx context.Context, userID int64, inviteHash string) (*service.AcceptInviteResponseDTO, error)
}

func (m *MockInviteService) CreateInvite(ctx context.Context, inviterID, groupID int64) (*domain.Invite, error) {
	if m.CreateInviteFunc != nil {
		return m.CreateInviteFunc(ctx, inviterID, groupID)
	}
	return nil, nil
}

func (m *MockInviteService) FindByHash(ctx context.Context, hash string) (*domain.Invite, error) {
	if m.FindByHashFunc != nil {
		return m.FindByHashFunc(ctx, hash)
	}
	return nil, nil
}

func (m *MockInviteService) AcceptInvite(ctx context.Context, userID int64, inviteHash string) (*service.AcceptInviteResponseDTO, error) {
	if m.AcceptInviteFunc != nil {
		return m.AcceptInviteFunc(ctx, userID, inviteHash)
	}
	return nil, nil
}

// MockUserGroupService is a mock implementation of IUserGroupService
type MockUserGroupService struct {
	AddUserToGroupFunc  func(ctx context.Context, userID, groupID int64) (*domain.UserGroup, error)
	GetGroupMembersFunc func(ctx context.Context, groupID int64) ([]*domain.UserGroup, error)
	GetUserGroupsFunc   func(ctx context.Context, userID int64) ([]*domain.UserGroup, error)
}

func (m *MockUserGroupService) GetGroupMembers(ctx context.Context, groupID int64) ([]*domain.UserGroup, error) {
	if m.GetGroupMembersFunc != nil {
		return m.GetGroupMembersFunc(ctx, groupID)
	}
	return nil, nil
}

func (m *MockUserGroupService) GetUserGroups(ctx context.Context, userID int64) ([]*domain.UserGroup, error) {
	if m.GetUserGroupsFunc != nil {
		return m.GetUserGroupsFunc(ctx, userID)
	}
	return nil, nil
}

// MockUserService is a mock implementation of IUserService for testing
type MockUserService struct {
	GetUserProfileFunc            func(ctx context.Context, userID int64) (*domain.UserProfile, error)
	SearchUserProfilesFunc        func(ctx context.Context, query string) ([]*domain.UserProfile, error)
	GetUserProfileWithContactFunc func(ctx context.Context, authUserID, userID int64) (*domain.UserProfile, *domain.Contact, error)
	UpdateUserProfileFunc         func(ctx context.Context, userID int64, globalName, bio, dp *string) (*domain.UserProfile, error)
}

func (m *MockUserService) GetUserProfile(ctx context.Context, userID int64) (*domain.UserProfile, error) {
	if m.GetUserProfileFunc != nil {
		return m.GetUserProfileFunc(ctx, userID)
	}
	return nil, nil
}

func (m *MockUserService) SearchUserProfiles(ctx context.Context, query string) ([]*domain.UserProfile, error) {
	if m.SearchUserProfilesFunc != nil {
		return m.SearchUserProfilesFunc(ctx, query)
	}
	return nil, nil
}

func (m *MockUserService) GetUserProfileWithContact(ctx context.Context, authUserID, userID int64) (*domain.UserProfile, *domain.Contact, error) {
	if m.GetUserProfileWithContactFunc != nil {
		return m.GetUserProfileWithContactFunc(ctx, authUserID, userID)
	}
	return nil, nil, nil
}

func (m *MockUserService) UpdateUserProfile(ctx context.Context, userID int64, globalName, bio, dp *string) (*domain.UserProfile, error) {
	if m.UpdateUserProfileFunc != nil {
		return m.UpdateUserProfileFunc(ctx, userID, globalName, bio, dp)
	}
	return nil, nil
}

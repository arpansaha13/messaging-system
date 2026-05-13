package mocks

import (
	"context"
	"time"

	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/service"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// MockGroupService is a mock implementation of IGroupService
type MockGroupService struct {
	CreateGroupFunc func(ctx context.Context, req *dto.CreateGroupDTO) (*domain.Group, error)
	GetGroupsFunc   func(ctx context.Context) ([]*domain.Group, error)
}

func (m *MockGroupService) CreateGroup(ctx context.Context, req *dto.CreateGroupDTO) (*domain.Group, error) {
	if m.CreateGroupFunc != nil {
		return m.CreateGroupFunc(ctx, req)
	}
	return nil, nil
}

func (m *MockGroupService) GetGroups(ctx context.Context) ([]*domain.Group, error) {
	if m.GetGroupsFunc != nil {
		return m.GetGroupsFunc(ctx)
	}
	return nil, nil
}

// MockChannelService is a mock implementation of IChannelService
type MockChannelService struct {
	CreateChannelFunc        func(ctx context.Context, req *dto.CreateChannelDTO) (*domain.Channel, error)
	GetChannelsFunc          func(ctx context.Context) ([]*domain.Channel, error)
	GetChannelsByGroupIDFunc func(ctx context.Context, req *dto.GetGroupChannelsDTO) ([]*domain.Channel, error)
	GetChannelByIDFunc       func(ctx context.Context, req *dto.GetChannelInfoDTO) (*domain.Channel, error)
}

func (m *MockChannelService) CreateChannel(ctx context.Context, req *dto.CreateChannelDTO) (*domain.Channel, error) {
	if m.CreateChannelFunc != nil {
		return m.CreateChannelFunc(ctx, req)
	}
	return nil, nil
}

func (m *MockChannelService) GetChannels(ctx context.Context) ([]*domain.Channel, error) {
	if m.GetChannelsFunc != nil {
		return m.GetChannelsFunc(ctx)
	}
	return nil, nil
}

func (m *MockChannelService) GetChannelsByGroupID(ctx context.Context, req *dto.GetGroupChannelsDTO) ([]*domain.Channel, error) {
	if m.GetChannelsByGroupIDFunc != nil {
		return m.GetChannelsByGroupIDFunc(ctx, req)
	}
	return nil, nil
}

func (m *MockChannelService) GetChannelByID(ctx context.Context, req *dto.GetChannelInfoDTO) (*domain.Channel, error) {
	if m.GetChannelByIDFunc != nil {
		return m.GetChannelByIDFunc(ctx, req)
	}
	return nil, nil
}

// MockChatService is a mock implementation of IChatService
type MockChatService struct {
	CreateChatFunc             func(ctx context.Context, req *dto.CreateChatDTO) (*domain.Chat, error)
	GetUserUnarchivedChatsFunc func(ctx context.Context) ([]*service.ChatItemDTO, error)
	GetUserArchivedChatsFunc   func(ctx context.Context) ([]*service.ChatItemDTO, error)
	PinChatFunc                func(ctx context.Context, req *dto.PinChatDTO) error
	UnpinChatFunc              func(ctx context.Context, req *dto.UnpinChatDTO) error
	ArchiveChatFunc            func(ctx context.Context, req *dto.ArchiveChatDTO) error
	UnarchiveChatFunc          func(ctx context.Context, req *dto.UnarchiveChatDTO) error
	ClearChatFunc              func(ctx context.Context, req *dto.ClearChatDTO) error
	DeleteChatFunc             func(ctx context.Context, req *dto.DeleteChatDTO) error
}

func (m *MockChatService) CreateChat(ctx context.Context, req *dto.CreateChatDTO) (*domain.Chat, error) {
	if m.CreateChatFunc != nil {
		return m.CreateChatFunc(ctx, req)
	}
	return nil, nil
}

func (m *MockChatService) GetUserUnarchivedChats(ctx context.Context) ([]*service.ChatItemDTO, error) {
	if m.GetUserUnarchivedChatsFunc != nil {
		return m.GetUserUnarchivedChatsFunc(ctx)
	}
	return nil, nil
}

func (m *MockChatService) GetUserArchivedChats(ctx context.Context) ([]*service.ChatItemDTO, error) {
	if m.GetUserArchivedChatsFunc != nil {
		return m.GetUserArchivedChatsFunc(ctx)
	}
	return nil, nil
}

func (m *MockChatService) PinChat(ctx context.Context, req *dto.PinChatDTO) error {
	if m.PinChatFunc != nil {
		return m.PinChatFunc(ctx, req)
	}
	return nil
}

func (m *MockChatService) UnpinChat(ctx context.Context, req *dto.UnpinChatDTO) error {
	if m.UnpinChatFunc != nil {
		return m.UnpinChatFunc(ctx, req)
	}
	return nil
}

func (m *MockChatService) ArchiveChat(ctx context.Context, req *dto.ArchiveChatDTO) error {
	if m.ArchiveChatFunc != nil {
		return m.ArchiveChatFunc(ctx, req)
	}
	return nil
}

func (m *MockChatService) UnarchiveChat(ctx context.Context, req *dto.UnarchiveChatDTO) error {
	if m.UnarchiveChatFunc != nil {
		return m.UnarchiveChatFunc(ctx, req)
	}
	return nil
}

func (m *MockChatService) ClearChat(ctx context.Context, req *dto.ClearChatDTO) error {
	if m.ClearChatFunc != nil {
		return m.ClearChatFunc(ctx, req)
	}
	return nil
}

func (m *MockChatService) DeleteChat(ctx context.Context, req *dto.DeleteChatDTO) error {
	if m.DeleteChatFunc != nil {
		return m.DeleteChatFunc(ctx, req)
	}
	return nil
}

// MockMessageService is a mock implementation of IMessageService
type MockMessageService struct {
	SendPersonalMessageFunc    func(ctx context.Context, req *dto.SendPersonalMessageDTO) (int64, time.Time, error)
	SendGroupMessageFunc       func(ctx context.Context, req *dto.SendGroupMessageDTO) (int64, time.Time, error)
	GetMessagesFunc            func(ctx context.Context, req *dto.GetMessagesDTO) (*repository.MessagePage, error)
	MarkMessageAsDeliveredFunc func(ctx context.Context, req *dto.HandleDeliveredDTO) error
	MarkMessageAsReadFunc      func(ctx context.Context, req *dto.HandleReadMultipleDTO) error
	GetChannelMessagesFunc     func(ctx context.Context, req *dto.GetChannelMessagesDTO) (*repository.ChannelMessagePage, error)
}

func (m *MockMessageService) SendPersonalMessage(ctx context.Context, req *dto.SendPersonalMessageDTO) (int64, time.Time, error) {
	if m.SendPersonalMessageFunc != nil {
		return m.SendPersonalMessageFunc(ctx, req)
	}
	return 0, time.Time{}, nil
}

func (m *MockMessageService) SendGroupMessage(ctx context.Context, req *dto.SendGroupMessageDTO) (int64, time.Time, error) {
	if m.SendGroupMessageFunc != nil {
		return m.SendGroupMessageFunc(ctx, req)
	}
	return 0, time.Time{}, nil
}

func (m *MockMessageService) GetMessages(ctx context.Context, req *dto.GetMessagesDTO) (*repository.MessagePage, error) {
	if m.GetMessagesFunc != nil {
		return m.GetMessagesFunc(ctx, req)
	}
	return nil, nil
}

func (m *MockMessageService) MarkMessageAsDelivered(ctx context.Context, req *dto.HandleDeliveredDTO) error {
	if m.MarkMessageAsDeliveredFunc != nil {
		return m.MarkMessageAsDeliveredFunc(ctx, req)
	}
	return nil
}

func (m *MockMessageService) MarkMessageAsRead(ctx context.Context, req *dto.HandleReadMultipleDTO) error {
	if m.MarkMessageAsReadFunc != nil {
		return m.MarkMessageAsReadFunc(ctx, req)
	}
	return nil
}

func (m *MockMessageService) GetChannelMessages(ctx context.Context, req *dto.GetChannelMessagesDTO) (*repository.ChannelMessagePage, error) {
	if m.GetChannelMessagesFunc != nil {
		return m.GetChannelMessagesFunc(ctx, req)
	}
	return nil, nil
}

// MockInviteService is a mock implementation of IInviteService
type MockInviteService struct {
	CreateInviteFunc func(ctx context.Context, req *dto.CreateInviteDTO) (*domain.Invite, error)
	FindByHashFunc   func(ctx context.Context, req *dto.FindInviteDTO) (*domain.Invite, error)
	AcceptInviteFunc func(ctx context.Context, input *dto.AcceptInviteInput) (*service.AcceptInviteResponseDTO, error)
}

func (m *MockInviteService) CreateInvite(ctx context.Context, req *dto.CreateInviteDTO) (*domain.Invite, error) {
	if m.CreateInviteFunc != nil {
		return m.CreateInviteFunc(ctx, req)
	}
	return nil, nil
}

func (m *MockInviteService) FindByHash(ctx context.Context, req *dto.FindInviteDTO) (*domain.Invite, error) {
	if m.FindByHashFunc != nil {
		return m.FindByHashFunc(ctx, req)
	}
	return nil, nil
}

func (m *MockInviteService) AcceptInvite(ctx context.Context, input *dto.AcceptInviteInput) (*service.AcceptInviteResponseDTO, error) {
	if m.AcceptInviteFunc != nil {
		return m.AcceptInviteFunc(ctx, input)
	}
	return nil, nil
}

// MockUserGroupService is a mock implementation of IUserGroupService
type MockUserGroupService struct {
	GetGroupMembersFunc func(ctx context.Context, req *dto.GetGroupMembersDTO) ([]*domain.UserGroup, error)
}

func (m *MockUserGroupService) GetGroupMembers(ctx context.Context, req *dto.GetGroupMembersDTO) ([]*domain.UserGroup, error) {
	if m.GetGroupMembersFunc != nil {
		return m.GetGroupMembersFunc(ctx, req)
	}
	return nil, nil
}


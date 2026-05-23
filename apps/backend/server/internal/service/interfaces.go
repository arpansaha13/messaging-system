package service

import (
	"context"
	"time"

	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/arpansaha13/messaging-system/apps/common/pb"
)

// IUserServiceClient defines the interface for user service client operations (profiles)
type IUserServiceClient interface {
	GetUserProfiles(ctx context.Context, userIDs []int64) (*pb.GetUserProfilesResponse, error)
	GetUserProfile(ctx context.Context, userID int64) (*pb.UserProfileData, error)
	GetDomainProfiles(ctx context.Context, userIDs []int64) (map[int64]*domain.UserProfile, error)
	GetDomainProfile(ctx context.Context, userID int64) (*domain.UserProfile, error)
	SearchUserProfiles(ctx context.Context, query string, limit int32) (*pb.SearchUserProfilesResponse, error)
	UpdateUserProfile(ctx context.Context, req *pb.UpdateUserProfileRequest) (*pb.UpdateUserProfileResponse, error)
	Close() error
}

// ChatService defines the interface for chat service operations
type IChatService interface {
	CreateChat(ctx context.Context, req *dto.CreateChatDTO) (*domain.Chat, error)
	GetUserUnarchivedChats(ctx context.Context) ([]*ChatItemDTO, error)
	GetUserArchivedChats(ctx context.Context) ([]*ChatItemDTO, error)
	PinChat(ctx context.Context, req *dto.PinChatDTO) error
	UnpinChat(ctx context.Context, req *dto.UnpinChatDTO) error
	ArchiveChat(ctx context.Context, req *dto.ArchiveChatDTO) error
	UnarchiveChat(ctx context.Context, req *dto.UnarchiveChatDTO) error
	ClearChat(ctx context.Context, req *dto.ClearChatDTO) error
	DeleteChat(ctx context.Context, req *dto.DeleteChatDTO) error
}

// MessageService defines the interface for message service operations
type IMessageService interface {
	SendPersonalMessage(ctx context.Context, req *dto.SendPersonalMessageDTO) (int64, time.Time, error)
	SendGroupMessage(ctx context.Context, req *dto.SendGroupMessageDTO) (int64, time.Time, error)
	GetMessages(ctx context.Context, req *dto.GetMessagesDTO) (*repository.MessagePage, error)
	MarkMessageAsDelivered(ctx context.Context, req *dto.HandleDeliveredDTO) error
	MarkMessageAsRead(ctx context.Context, req *dto.HandleReadMultipleDTO) error
	GetChannelMessages(ctx context.Context, req *dto.GetChannelMessagesDTO) (*repository.ChannelMessagePage, error)
}

// ChannelService defines the interface for channel service operations
type IChannelService interface {
	CreateChannel(ctx context.Context, req *dto.CreateChannelDTO) (*domain.Channel, error)
	GetChannels(ctx context.Context) ([]*domain.Channel, error)
	GetChannelsByGroupID(ctx context.Context, req *dto.GetGroupChannelsDTO) ([]*domain.Channel, error)
	GetChannelByID(ctx context.Context, req *dto.GetChannelInfoDTO) (*domain.Channel, error)
}

// GroupService defines the interface for group service operations
type IGroupService interface {
	CreateGroup(ctx context.Context, req *dto.CreateGroupDTO) (*domain.Group, error)
	GetGroups(ctx context.Context) ([]*domain.Group, error)
}

// InviteService defines the interface for invite service operations
type IInviteService interface {
	CreateInvite(ctx context.Context, req *dto.CreateInviteDTO) (*domain.Invite, error)
	FindByHash(ctx context.Context, req *dto.FindInviteDTO) (*domain.Invite, error)
	AcceptInvite(ctx context.Context, input *dto.AcceptInviteInput) (*AcceptInviteResponseDTO, error)
}

// UserGroupService defines the interface for user group service operations
type IUserGroupService interface {
	GetGroupMembers(ctx context.Context, req *dto.GetGroupMembersDTO) ([]*domain.UserGroup, error)
}

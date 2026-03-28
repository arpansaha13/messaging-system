package service

import (
	"context"
	"time"

	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/server/pb"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// AuthServiceClient defines the interface for auth service client operations
type IAuthServiceClient interface {
	ValidateSession(ctx context.Context, token string) (*pb.ValidateSessionResponse, error)
	Signup(ctx context.Context, email, password string) (*pb.SignupResponse, error)
	Login(ctx context.Context, email, password string) (*pb.LoginResponse, error)
	VerifyOTP(ctx context.Context, otpHash, code string) (*pb.VerifyOTPResponse, error)
	Logout(ctx context.Context, token string) (*pb.LogoutResponse, error)
	GetUser(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error)
	Close() error
}

// UserService defines the interface for user service operations
type IUserService interface {
	GetUserProfile(ctx context.Context) (*domain.UserProfile, error)
	SearchUserProfiles(ctx context.Context, req *dto.SearchUsersDTO) ([]*domain.UserProfile, error)
	GetUserProfileWithContact(ctx context.Context, req *dto.GetUserByIDDTO) (*domain.UserProfile, *domain.Contact, error)
	UpdateUserProfile(ctx context.Context, req *dto.UpdateUserDTO) (*domain.UserProfile, error)
}

// ContactService defines the interface for contact service operations
type IContactService interface {
	AddContact(ctx context.Context, req *dto.AddContactDTO) (*domain.Contact, error)
	GetContacts(ctx context.Context) ([]*repository.ContactWithUserInfo, error)
	UpdateContactAlias(ctx context.Context, req *dto.UpdateContactAliasDTO) (*domain.Contact, error)
	DeleteContact(ctx context.Context, req *dto.DeleteContactDTO) error
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

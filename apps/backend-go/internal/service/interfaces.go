package service

import (
	"context"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend-go/pb"
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
	GetUserProfile(ctx context.Context, userID int64) (*domain.UserProfile, error)
	SearchUserProfiles(ctx context.Context, query string) ([]*domain.UserProfile, error)
	GetUserProfileWithContact(ctx context.Context, authUserID, userID int64) (*domain.UserProfile, *domain.Contact, error)
	UpdateUserProfile(ctx context.Context, userID int64, globalName, bio, dp *string) (*domain.UserProfile, error)
}

// ContactService defines the interface for contact service operations
type IContactService interface {
	AddContact(ctx context.Context, userID, userIDInContact int64) (*domain.Contact, error)
	GetContacts(ctx context.Context, userID int64) ([]*repository.ContactWithUserInfo, error)
}

// ChatService defines the interface for chat service operations
type IChatService interface {
	CreateChat(ctx context.Context, user1ID, user2ID int64) (*domain.Chat, error)
	GetUserChats(ctx context.Context, userID int64) (*ChatsResponseDTO, error)
	PinChat(ctx context.Context, userID, receiverID int64) error
	UnpinChat(ctx context.Context, userID, receiverID int64) error
	ArchiveChat(ctx context.Context, userID, receiverID int64) error
	UnarchiveChat(ctx context.Context, userID, receiverID int64) error
	ClearChat(ctx context.Context, userID, receiverID int64) error
	DeleteChat(ctx context.Context, userID, receiverID int64) error
}

// MessageService defines the interface for message service operations
type IMessageService interface {
	SendPersonalMessage(ctx context.Context, senderID, receiverID int64, content, hash string) error
	SendGroupMessage(ctx context.Context, senderID, groupID, channelID int64, content, hash string) error
	GetMessages(ctx context.Context, userID, receiverID int64, limit, offset int) ([]*repository.MessageWithStatus, error)
	MarkMessageAsDelivered(ctx context.Context, messageID, receiverID, senderID int64) error
	MarkMessageAsRead(ctx context.Context, messages []ReadPayload) error
	GetChannelMessages(ctx context.Context, channelID int64, limit, offset int) ([]*domain.Message, error)
}

// ChannelService defines the interface for channel service operations
type IChannelService interface {
	CreateChannel(ctx context.Context, name string, groupID int64) (*domain.Channel, error)
	GetChannels(ctx context.Context) ([]*domain.Channel, error)
	GetChannelsByGroupID(ctx context.Context, groupID int64) ([]*domain.Channel, error)
	GetChannelByID(ctx context.Context, channelID int64) (*domain.Channel, error)
}

// GroupService defines the interface for group service operations
type IGroupService interface {
	CreateGroup(ctx context.Context, name string, founderID int64) (*domain.Group, error)
	GetGroups(ctx context.Context, userID int64) ([]*domain.Group, error)
}

// InviteService defines the interface for invite service operations
type IInviteService interface {
	CreateInvite(ctx context.Context, inviterID, groupID int64) (*domain.Invite, error)
	FindByHash(ctx context.Context, hash string) (*domain.Invite, error)
	AcceptInvite(ctx context.Context, userID int64, inviteHash string) (*AcceptInviteResponseDTO, error)
}

// UserGroupService defines the interface for user group service operations
type IUserGroupService interface {
	GetGroupMembers(ctx context.Context, groupID int64) ([]*domain.UserGroup, error)
}

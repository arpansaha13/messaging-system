package dto

// Auth Request DTOs

// SignupRequestDTO represents a signup request
type SignupRequestDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequestDTO represents a login request
type LoginRequestDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// VerifyOTPRequestDTO represents an OTP verification request
type VerifyOTPRequestDTO struct {
	Code string `json:"code"`
}

// User Request DTOs

// UpdateUserRequestDTO represents an update user request
type UpdateUserRequestDTO struct {
	GlobalName *string `json:"globalName,omitempty"`
	DP         *string `json:"dp,omitempty"`
	Bio        *string `json:"bio,omitempty"`
}

// Chat Request DTOs

// CreateChatRequestDTO represents a create chat request
type CreateChatRequestDTO struct {
	ReceiverID int64 `json:"receiverId"`
}

// Message Request DTOs

// SendPersonalMessageDTO represents a send personal message request
type SendPersonalMessageDTO struct {
	ReceiverID int64  `json:"receiverId"`
	Content    string `json:"content"`
	Hash       string `json:"hash"`
}

// SendGroupMessageDTO represents a send group message request
type SendGroupMessageDTO struct {
	GroupID   int64  `json:"groupId"`
	ChannelID int64  `json:"channelId"`
	Content   string `json:"content"`
	Hash      string `json:"hash"`
}

// HandleDeliveredDTO represents a handle delivered message request
type HandleDeliveredDTO struct {
	MessageID  int64 `json:"messageId"`
	ReceiverID int64 `json:"receiverId"`
	SenderID   int64 `json:"senderId"`
}

// HandleReadDTO represents a handle read message request
type HandleReadDTO struct {
	MessageID  int64 `json:"messageId"`
	SenderID   int64 `json:"senderId"`
	ReceiverID int64 `json:"receiverId"`
}

// HandleReadMultipleDTO represents multiple read messages request
type HandleReadMultipleDTO struct {
	Messages []HandleReadDTO `json:"messages"`
}

// Group Request DTOs

// CreateGroupRequestDTO represents a create group request
type CreateGroupRequestDTO struct {
	Name string `json:"name"`
}

// Channel Request DTOs

// CreateChannelRequestDTO represents a create channel request
type CreateChannelRequestDTO struct {
	Name string `json:"name"`
}

// Contact Request DTOs

// AddContactRequestDTO represents an add contact request
type AddContactRequestDTO struct {
	UserIDToAdd int64  `json:"userIdToAdd"`
	Alias       string `json:"alias"`
}

// UpdateContactAliasRequestDTO represents an update contact alias request
type UpdateContactAliasRequestDTO struct {
	NewAlias string `json:"new_alias"`
}

// UserGroup Request DTOs

// AddUserToGroupRequestDTO represents an add user to group request
type AddUserToGroupRequestDTO struct {
	UserID int64 `json:"user_id"`
}

// Invite Request DTOs

// InviteHashParamDTO represents the hash parameter for invite endpoints
type InviteHashParamDTO struct {
	Hash string `json:"hash"`
}

// JoinGroupDTO represents a request to join a group via invite hash
type JoinGroupDTO struct {
	InviteHash string `json:"inviteHash"`
}

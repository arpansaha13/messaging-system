package dto

import (
	"time"

	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// Auth Response DTOs

// SignupResponseDTO represents the response for signup
type SignupResponseDTO struct {
	Message string `json:"message"`
	OtpHash string `json:"otpHash"`
}

// LoginResponseDTO represents the response for login
type LoginResponseDTO struct {
	Message string `json:"message"`
}

// VerifyOTPResponseDTO represents the response for OTP verification
type VerifyOTPResponseDTO struct {
	Message string `json:"message"`
}

// User Response DTOs

// ContactInfoDTO represents contact information in user profiles
type ContactInfoDTO struct {
	ID    int64  `json:"id"`
	Alias string `json:"alias"`
}

// UserProfileResponseDTO represents a user profile in responses
type UserProfileResponseDTO struct {
	ID         int64           `json:"id"`
	GlobalName string          `json:"globalName"`
	DP         *string         `json:"dp"`
	Bio        string          `json:"bio"`
	Contact    *ContactInfoDTO `json:"contact"`
}



// Message Response DTOs

// SendPersonalMessageResponseDTO represents the response when a personal message is created
type SendPersonalMessageResponseDTO struct {
	ID        int64                `json:"id"`
	Hash      string               `json:"hash"`
	Content   string               `json:"content"`
	SenderID  int64                `json:"senderId"`
	CreatedAt time.Time            `json:"createdAt"`
	Status    domain.MessageStatus `json:"status"`
}

// SendGroupMessageResponseDTO represents the response when a group message is created
type SendGroupMessageResponseDTO struct {
	ID        int64                `json:"id"`
	Hash      string               `json:"hash"`
	Content   string               `json:"content"`
	SenderID  int64                `json:"senderId"`
	ChannelID int64                `json:"channelId"`
	CreatedAt time.Time            `json:"createdAt"`
	Status    domain.MessageStatus `json:"status"`
}

// MessageResponseDTO represents a message in responses
type MessageResponseDTO struct {
	ID        int64                `json:"id"`
	SenderID  int64                `json:"senderId"`
	Content   string               `json:"content"`
	Status    domain.MessageStatus `json:"status,omitempty"`
	CreatedAt time.Time            `json:"createdAt"`
	UpdatedAt time.Time            `json:"updatedAt"`
}

// MessageRecipientResponseDTO represents message delivery status
type MessageRecipientResponseDTO struct {
	ID         int64     `json:"id"`
	MessageID  int64     `json:"messageId"`
	ReceiverID int64     `json:"receiverId"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// MessageStatusResponseDTO represents a message status update response
type MessageStatusResponseDTO struct {
	Status string `json:"status"`
}

// PaginatedMessagesResponseDTO represents paginated messages response
type PaginatedMessagesResponseDTO struct {
	Messages  []MessageResponseDTO `json:"messages"`
	HasBefore bool                 `json:"hasBefore"`
	HasAfter  bool                 `json:"hasAfter"`
}

// Chat Response DTOs

// ChatResponseDTO represents a chat in responses
type ChatResponseDTO struct {
	ID         int64     `json:"id"`
	SenderID   int64     `json:"senderId"`
	ReceiverID int64     `json:"receiverId"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// Group Response DTOs

// GroupResponseDTO represents a group in responses
type GroupResponseDTO struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	FounderID int64     `json:"founderId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Channel Response DTOs

// ChannelResponseDTO represents a channel in responses
type ChannelResponseDTO struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	GroupID   int64     `json:"groupId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}



// UserGroup Response DTOs

// UserGroupResponseDTO represents a user group membership in responses
type UserGroupResponseDTO struct {
	ID        int64                  `json:"id"`
	User      UserProfileResponseDTO `json:"user"`
	GroupID   int64                  `json:"groupId"`
	Role      string                 `json:"role"`
	CreatedAt time.Time              `json:"createdAt"`
	UpdatedAt time.Time              `json:"updatedAt"`
}

// Invite Response DTOs

// InviteResponseDTO represents an invite in responses
type InviteResponseDTO struct {
	Hash      string     `json:"hash"`
	InviterID int64      `json:"inviterId"`
	GroupID   *int64     `json:"groupId,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty"`
}

// AcceptInviteResponseDTO represents the response when accepting an invite
type AcceptInviteResponseDTO struct {
	GroupID  int64   `json:"groupId"`
	Channels []int64 `json:"channels"`
}

// Paginated Response DTOs

// PaginatedResponseDTO wraps paginated data
type PaginatedResponseDTO struct {
	Data  any `json:"data"`
	Total int `json:"total"`
	Page  int `json:"page"`
	Limit int `json:"limit"`
}

// Generic Response DTOs

// ErrorResponseDTO represents an error response
type ErrorResponseDTO struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

// SuccessResponseDTO represents a generic success response
type SuccessResponseDTO struct {
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

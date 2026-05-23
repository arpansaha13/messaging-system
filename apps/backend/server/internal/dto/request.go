package dto

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/gorilla/mux"
)

// ── Auth DTOs ─────────────────────────────────────────────────────────────────

// SignupDTO holds signup request data.
type SignupDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func NewSignupDTO(r *http.Request) (*SignupDTO, error) {
	d := &SignupDTO{}
	if err := json.NewDecoder(r.Body).Decode(d); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return d, nil
}

func (d *SignupDTO) Validate() error {
	if d.Email == "" || d.Password == "" {
		return &gtk.ValidationError{Message: "email and password are required"}
	}
	return nil
}

// LoginDTO holds login request data.
type LoginDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func NewLoginDTO(r *http.Request) (*LoginDTO, error) {
	d := &LoginDTO{}
	if err := json.NewDecoder(r.Body).Decode(d); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return d, nil
}

func (d *LoginDTO) Validate() error {
	if d.Email == "" || d.Password == "" {
		return &gtk.ValidationError{Message: "email and password are required"}
	}
	return nil
}

// VerifyOTPDTO holds OTP verification data (path param + body).
type VerifyOTPDTO struct {
	OtpHash string
	Code    string `json:"code"`
}

func NewVerifyOTPDTO(r *http.Request) (*VerifyOTPDTO, error) {
	d := &VerifyOTPDTO{}
	vars := mux.Vars(r)
	d.OtpHash = vars["otpHash"]
	if err := json.NewDecoder(r.Body).Decode(d); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return d, nil
}

func (d *VerifyOTPDTO) Validate() error {
	if d.OtpHash == "" || d.Code == "" {
		return &gtk.ValidationError{Message: "otp hash and code are required"}
	}
	return nil
}

// ── Message DTOs ──────────────────────────────────────────────────────────────

// SendPersonalMessageDTO holds data for sending a personal message.
type SendPersonalMessageDTO struct {
	ReceiverID int64  `json:"receiverId"`
	Content    string `json:"content"`
	Hash       string `json:"hash"`
}

func NewSendPersonalMessageDTO(r *http.Request) (*SendPersonalMessageDTO, error) {
	d := &SendPersonalMessageDTO{}
	if err := json.NewDecoder(r.Body).Decode(d); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return d, nil
}

func (d *SendPersonalMessageDTO) Validate() error {
	if d.ReceiverID == 0 || d.Content == "" || d.Hash == "" {
		return &gtk.ValidationError{Message: "receiverId, content, and hash are required"}
	}
	return nil
}

// SendGroupMessageDTO holds data for sending a group message.
type SendGroupMessageDTO struct {
	GroupID   int64  `json:"groupId"`
	ChannelID int64  `json:"channelId"`
	Content   string `json:"content"`
	Hash      string `json:"hash"`
}

func NewSendGroupMessageDTO(r *http.Request) (*SendGroupMessageDTO, error) {
	d := &SendGroupMessageDTO{}
	if err := json.NewDecoder(r.Body).Decode(d); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return d, nil
}

func (d *SendGroupMessageDTO) Validate() error {
	if d.GroupID == 0 || d.ChannelID == 0 || d.Content == "" || d.Hash == "" {
		return &gtk.ValidationError{Message: "groupId, channelId, content, and hash are required"}
	}
	return nil
}

// GetMessagesDTO holds cursor params for fetching personal messages.
type GetMessagesDTO struct {
	ReceiverID int64
	Before     *int64
	After      *int64
}

func NewGetMessagesDTO(r *http.Request) (*GetMessagesDTO, error) {
	vars := mux.Vars(r)
	receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
	if err != nil {
		return nil, &gtk.ValidationError{Message: "invalid receiver id"}
	}
	d := &GetMessagesDTO{ReceiverID: receiverID}
	if b := r.URL.Query().Get("before"); b != "" {
		if parsed, err := strconv.ParseInt(b, 10, 64); err == nil {
			d.Before = &parsed
		}
	}
	if a := r.URL.Query().Get("after"); a != "" {
		if parsed, err := strconv.ParseInt(a, 10, 64); err == nil {
			d.After = &parsed
		}
	}
	return d, nil
}

func (d *GetMessagesDTO) Validate() error {
	if d.Before != nil && d.After != nil {
		return &gtk.ValidationError{Message: "cannot specify both 'before' and 'after'"}
	}
	return nil
}

// GetChannelMessagesDTO holds cursor params for fetching channel messages.
type GetChannelMessagesDTO struct {
	ChannelID int64
	Before    *int64
	After     *int64
}

func NewGetChannelMessagesDTO(r *http.Request) (*GetChannelMessagesDTO, error) {
	vars := mux.Vars(r)
	channelID, err := strconv.ParseInt(vars["channelID"], 10, 64)
	if err != nil {
		return nil, &gtk.ValidationError{Message: "invalid channel id"}
	}
	d := &GetChannelMessagesDTO{ChannelID: channelID}
	if b := r.URL.Query().Get("before"); b != "" {
		if parsed, err := strconv.ParseInt(b, 10, 64); err == nil {
			d.Before = &parsed
		}
	}
	if a := r.URL.Query().Get("after"); a != "" {
		if parsed, err := strconv.ParseInt(a, 10, 64); err == nil {
			d.After = &parsed
		}
	}
	return d, nil
}

func (d *GetChannelMessagesDTO) Validate() error {
	if d.Before != nil && d.After != nil {
		return &gtk.ValidationError{Message: "cannot specify both 'before' and 'after'"}
	}
	return nil
}

// HandleDeliveredDTO holds the message ID for a delivery acknowledgement.
type HandleDeliveredDTO struct {
	MessageID int64 `json:"messageId"`
}

func NewHandleDeliveredDTO(r *http.Request) (*HandleDeliveredDTO, error) {
	d := &HandleDeliveredDTO{}
	if err := json.NewDecoder(r.Body).Decode(d); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return d, nil
}

func (d *HandleDeliveredDTO) Validate() error {
	if d.MessageID == 0 {
		return &gtk.ValidationError{Message: "messageId is required"}
	}
	return nil
}

// HandleReadItem is a single message entry in a read-acknowledgement batch.
type HandleReadItem struct {
	MessageID int64 `json:"messageId"`
}

// HandleReadMultipleDTO holds a batch of message IDs to mark as read.
type HandleReadMultipleDTO struct {
	Messages []HandleReadItem `json:"messages"`
}

func NewHandleReadMultipleDTO(r *http.Request) (*HandleReadMultipleDTO, error) {
	d := &HandleReadMultipleDTO{}
	if err := json.NewDecoder(r.Body).Decode(d); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return d, nil
}

func (d *HandleReadMultipleDTO) Validate() error {
	return nil // empty list is acceptable
}

// ── Chat DTOs ─────────────────────────────────────────────────────────────────

// CreateChatDTO holds the receiver ID for creating a chat.
type CreateChatDTO struct {
	ReceiverID int64 `json:"receiverId"`
}

func NewCreateChatDTO(r *http.Request) (*CreateChatDTO, error) {
	d := &CreateChatDTO{}
	if err := json.NewDecoder(r.Body).Decode(d); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return d, nil
}

func (d *CreateChatDTO) Validate() error {
	if d.ReceiverID == 0 {
		return &gtk.ValidationError{Message: "receiverId is required"}
	}
	return nil
}

// PinChatDTO holds the receiver ID for pinning a chat.
type PinChatDTO struct{ ReceiverID int64 }

func NewPinChatDTO(r *http.Request) (*PinChatDTO, error) {
	receiverID, err := parseReceiverIDVar(r)
	if err != nil {
		return nil, err
	}
	return &PinChatDTO{ReceiverID: receiverID}, nil
}

func (d *PinChatDTO) Validate() error { return nil }

// UnpinChatDTO holds the receiver ID for unpinning a chat.
type UnpinChatDTO struct{ ReceiverID int64 }

func NewUnpinChatDTO(r *http.Request) (*UnpinChatDTO, error) {
	receiverID, err := parseReceiverIDVar(r)
	if err != nil {
		return nil, err
	}
	return &UnpinChatDTO{ReceiverID: receiverID}, nil
}

func (d *UnpinChatDTO) Validate() error { return nil }

// ArchiveChatDTO holds the receiver ID for archiving a chat.
type ArchiveChatDTO struct{ ReceiverID int64 }

func NewArchiveChatDTO(r *http.Request) (*ArchiveChatDTO, error) {
	receiverID, err := parseReceiverIDVar(r)
	if err != nil {
		return nil, err
	}
	return &ArchiveChatDTO{ReceiverID: receiverID}, nil
}

func (d *ArchiveChatDTO) Validate() error { return nil }

// UnarchiveChatDTO holds the receiver ID for unarchiving a chat.
type UnarchiveChatDTO struct{ ReceiverID int64 }

func NewUnarchiveChatDTO(r *http.Request) (*UnarchiveChatDTO, error) {
	receiverID, err := parseReceiverIDVar(r)
	if err != nil {
		return nil, err
	}
	return &UnarchiveChatDTO{ReceiverID: receiverID}, nil
}

func (d *UnarchiveChatDTO) Validate() error { return nil }

// ClearChatDTO holds the receiver ID for clearing chat history.
type ClearChatDTO struct{ ReceiverID int64 }

func NewClearChatDTO(r *http.Request) (*ClearChatDTO, error) {
	receiverID, err := parseReceiverIDVar(r)
	if err != nil {
		return nil, err
	}
	return &ClearChatDTO{ReceiverID: receiverID}, nil
}

func (d *ClearChatDTO) Validate() error { return nil }

// DeleteChatDTO holds the receiver ID for deleting a chat.
type DeleteChatDTO struct{ ReceiverID int64 }

func NewDeleteChatDTO(r *http.Request) (*DeleteChatDTO, error) {
	receiverID, err := parseReceiverIDVar(r)
	if err != nil {
		return nil, err
	}
	return &DeleteChatDTO{ReceiverID: receiverID}, nil
}

func (d *DeleteChatDTO) Validate() error { return nil }

// ── Group DTOs ────────────────────────────────────────────────────────────────

// CreateGroupDTO holds data for creating a group.
type CreateGroupDTO struct {
	Name string `json:"name"`
}

func NewCreateGroupDTO(r *http.Request) (*CreateGroupDTO, error) {
	d := &CreateGroupDTO{}
	if err := json.NewDecoder(r.Body).Decode(d); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return d, nil
}

func (d *CreateGroupDTO) Validate() error {
	if d.Name == "" {
		return &gtk.ValidationError{Message: "group name is required"}
	}
	return nil
}

// ── Channel DTOs ──────────────────────────────────────────────────────────────

// CreateChannelDTO holds data for creating a channel (path param + body).
type CreateChannelDTO struct {
	GroupID int64
	Name    string `json:"name"`
}

func NewCreateChannelDTO(r *http.Request) (*CreateChannelDTO, error) {
	vars := mux.Vars(r)
	groupID, err := strconv.ParseInt(vars["groupID"], 10, 64)
	if err != nil {
		return nil, &gtk.ValidationError{Message: "invalid group id"}
	}
	d := &CreateChannelDTO{GroupID: groupID}
	if err := json.NewDecoder(r.Body).Decode(d); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return d, nil
}

func (d *CreateChannelDTO) Validate() error {
	if d.Name == "" {
		return &gtk.ValidationError{Message: "channel name is required"}
	}
	return nil
}

// GetGroupChannelsDTO holds the group ID for listing channels.
type GetGroupChannelsDTO struct {
	GroupID int64
}

func NewGetGroupChannelsDTO(r *http.Request) (*GetGroupChannelsDTO, error) {
	vars := mux.Vars(r)
	groupID, err := strconv.ParseInt(vars["groupID"], 10, 64)
	if err != nil {
		return nil, &gtk.ValidationError{Message: "invalid group id"}
	}
	return &GetGroupChannelsDTO{GroupID: groupID}, nil
}

func (d *GetGroupChannelsDTO) Validate() error { return nil }

// GetChannelInfoDTO holds the channel ID for a channel info lookup.
type GetChannelInfoDTO struct {
	ChannelID int64
}

func NewGetChannelInfoDTO(r *http.Request) (*GetChannelInfoDTO, error) {
	vars := mux.Vars(r)
	channelID, err := strconv.ParseInt(vars["channelID"], 10, 64)
	if err != nil {
		return nil, &gtk.ValidationError{Message: "invalid channel id"}
	}
	return &GetChannelInfoDTO{ChannelID: channelID}, nil
}

func (d *GetChannelInfoDTO) Validate() error { return nil }

// ── Invite DTOs ───────────────────────────────────────────────────────────────

// FindInviteDTO holds the invite hash for a lookup.
type FindInviteDTO struct {
	Hash string
}

func NewFindInviteDTO(r *http.Request) (*FindInviteDTO, error) {
	return &FindInviteDTO{Hash: mux.Vars(r)["hash"]}, nil
}

func (d *FindInviteDTO) Validate() error {
	if d.Hash == "" {
		return &gtk.ValidationError{Message: "hash parameter is required"}
	}
	return nil
}

// AcceptInviteDTO holds the invite hash extracted from a path param.
type AcceptInviteDTO struct {
	Hash string
}

func NewAcceptInviteDTO(r *http.Request) (*AcceptInviteDTO, error) {
	return &AcceptInviteDTO{Hash: mux.Vars(r)["hash"]}, nil
}

func (d *AcceptInviteDTO) Validate() error {
	if d.Hash == "" {
		return &gtk.ValidationError{Message: "hash parameter is required"}
	}
	return nil
}

// CreateInviteDTO holds the group ID for creating an invite link.
type CreateInviteDTO struct {
	GroupID int64
}

func NewCreateInviteDTO(r *http.Request) (*CreateInviteDTO, error) {
	vars := mux.Vars(r)
	groupID, err := strconv.ParseInt(vars["groupId"], 10, 64)
	if err != nil || groupID == 0 {
		return nil, &gtk.ValidationError{Message: "group_id parameter is required"}
	}
	return &CreateInviteDTO{GroupID: groupID}, nil
}

func (d *CreateInviteDTO) Validate() error { return nil }

// JoinGroupDTO holds the invite hash supplied in the request body.
type JoinGroupDTO struct {
	InviteHash string `json:"inviteHash"`
}

func NewJoinGroupDTO(r *http.Request) (*JoinGroupDTO, error) {
	d := &JoinGroupDTO{}
	if err := json.NewDecoder(r.Body).Decode(d); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return d, nil
}

func (d *JoinGroupDTO) Validate() error {
	if d.InviteHash == "" {
		return &gtk.ValidationError{Message: "inviteHash is required"}
	}
	return nil
}

// ── UserGroup DTOs ────────────────────────────────────────────────────────────

// GetGroupMembersDTO holds the group ID for fetching members.
type GetGroupMembersDTO struct {
	GroupID int64
}

func NewGetGroupMembersDTO(r *http.Request) (*GetGroupMembersDTO, error) {
	vars := mux.Vars(r)
	groupID, err := strconv.ParseInt(vars["groupID"], 10, 64)
	if err != nil {
		return nil, &gtk.ValidationError{Message: "invalid group id"}
	}
	return &GetGroupMembersDTO{GroupID: groupID}, nil
}

func (d *GetGroupMembersDTO) Validate() error { return nil }

// AddUserToGroupDTO holds the user ID for adding a user to a group.
type AddUserToGroupDTO struct {
	UserID int64 `json:"user_id"`
}

func NewAddUserToGroupDTO(r *http.Request) (*AddUserToGroupDTO, error) {
	d := &AddUserToGroupDTO{}
	if err := json.NewDecoder(r.Body).Decode(d); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return d, nil
}

func (d *AddUserToGroupDTO) Validate() error {
	if d.UserID == 0 {
		return &gtk.ValidationError{Message: "user_id is required"}
	}
	return nil
}

// ── Canonical service-layer input types ───────────────────────────────────────

// AcceptInviteInput is the canonical service-layer input for accepting an invite.
// It is not tied to a specific HTTP source — both acceptInviteController (path param)
// and joinGroupController (body) construct it from their respective DTOs.
type AcceptInviteInput struct {
	InviteHash string
}

// ── helpers ───────────────────────────────────────────────────────────────────

func parseReceiverIDVar(r *http.Request) (int64, error) {
	vars := mux.Vars(r)
	receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
	if err != nil {
		return 0, &gtk.ValidationError{Message: "invalid receiver id"}
	}
	return receiverID, nil
}

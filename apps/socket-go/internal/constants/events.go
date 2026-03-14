package constants

// SocketEvent is a typed string alias for socket event names.
// Using a type alias (=) instead of a new type keeps it assignment-compatible
// with plain string, which is what JSON unmarshalling produces.
type SocketEvent = string

// Personal chat socket events.
const (
	PersonalMessageSend     SocketEvent = "personal:send-message"
	PersonalMessageReceive  SocketEvent = "personal:receive-message"
	PersonalStatusDelivered SocketEvent = "personal:delivered"
	PersonalStatusRead      SocketEvent = "personal:read"
	PersonalTyping          SocketEvent = "personal:typing"
	PersonalCheckOnline     SocketEvent = "personal:check-online"
	PersonalCheckOnlineResp SocketEvent = "personal:check-online-response"
)

// Group chat socket events.
const (
	GroupNewGroup        SocketEvent = "group:new-group"
	GroupNewChannel      SocketEvent = "group:new-channel"
	GroupJoinGroup       SocketEvent = "group:join-group"
	GroupMessageSend     SocketEvent = "group:send-message"
	GroupStatusSent      SocketEvent = "group:sent"
	GroupMessageReceive  SocketEvent = "group:receive-message"
	GroupStatusDelivered SocketEvent = "group:delivered"
	GroupStatusRead      SocketEvent = "group:read"
)

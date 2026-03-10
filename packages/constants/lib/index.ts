export enum MessageStatus {
  SENDING = 0,
  SENT = 1,
  DELIVERED = 2,
  READ = 3,
}

enum SocketEvents_Personal {
  MESSAGE_SEND = 'personal:send-message',
  MESSAGE_RECEIVE = 'personal:receive-message',
  STATUS_SENT = 'personal:sent',
  STATUS_DELIVERED = 'personal:delivered',
  STATUS_READ = 'personal:read',
  TYPING = 'personal:typing',
  CHECK_ONLINE = 'personal:check-online',
  CHECK_ONLINE_RESPONSE = 'personal:check-online-response',
}

enum SocketEvents_Group {
  NEW_GROUP = 'group:new-group',
  NEW_CHANNEL = 'group:new-channel',
  JOIN_GROUP = 'group:join-group',
  MESSAGE_SEND = 'group:send-message',
  STATUS_SENT = 'group:sent',
  MESSAGE_RECEIVE = 'group:receive-message',
  STATUS_DELIVERED = 'group:delivered',
  STATUS_READ = 'group:read',
}

export const SocketEvents = {
  PERSONAL: SocketEvents_Personal,
  GROUP: SocketEvents_Group,
}

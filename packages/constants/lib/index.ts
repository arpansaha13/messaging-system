export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

enum SocketEvents_Personal {
  MESSAGE_SEND = 'personal:send-message',
  MESSAGE_RECEIVE = 'personal:receive-message',
  STATUS_SENT = 'personal:sent',
  STATUS_DELIVERED = 'personal:delivered',
  STATUS_READ = 'personal:read',
  TYPING = 'personal:typing',
}

enum SocketEvents_Group {
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

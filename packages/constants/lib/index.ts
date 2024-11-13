export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

enum SocketEvents_Personal {
  MESSAGE_SEND = 'send-message',
  MESSAGE_RECEIVE = 'receive-message',
  STATUS_SENT = 'sent',
  STATUS_DELIVERED = 'delivered',
  STATUS_READ = 'read',
  TYPING = 'typing',
}

export const SocketEvents = {
  PERSONAL: SocketEvents_Personal,
}

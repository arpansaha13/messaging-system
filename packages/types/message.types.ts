export interface MsgSendingType {
  hash: string
  content: string
  senderId: number
  status: MessageStatus.SENDING

  /** For deciding the order in which messages should be shown in chat window */
  createdInClientAt: Date
}
export interface MessageType {
  id: number
  content: string
  senderId: number
  createdAt: string
  status: Exclude<MessageStatus, MessageStatus.SENDING>
}

export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

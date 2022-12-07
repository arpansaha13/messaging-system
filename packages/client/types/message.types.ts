export interface MsgSendingType {
  content: string
  senderId: number
  createdAt: string
  status: MessageStatus.SENDING
}
export interface MsgConfirmedType {
  content: string
  senderId: number
  createdAt: string
  status: Exclude<MessageStatus, MessageStatus.SENDING>
}
export interface MsgReceivedType {
  content: string
  senderId: number
  createdAt: string
  status: null
}
export type MessageType = MsgSendingType | MsgConfirmedType | MsgReceivedType

export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

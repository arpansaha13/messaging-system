export interface MsgSendingType {
  // id: number
  content: string
  senderId: number
  createdAt: string
  status: MessageStatus.SENDING
}
export interface MsgConfirmedType {
  // id: number
  content: string
  senderId: number
  createdAt: string
  status: Exclude<MessageStatus, MessageStatus.SENDING>
}
export interface MsgReceivedType {
  // id: number
  content: string
  senderId: number
  createdAt: string
  status: MessageStatus.DELIVERED
}
export type MessageType = MsgSendingType | MsgConfirmedType | MsgReceivedType

export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

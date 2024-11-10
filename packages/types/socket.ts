import type { MessageStatus } from './message'

export interface ISenderEmitMessage {
  hash: string
  content: string
  senderId: number
  receiverId: number
  status: MessageStatus.SENDING
}

interface IReceiverOnMessage {
  messageId: number
  content: string
  senderId: number
  createdAt: string
  status: MessageStatus.SENT
}

interface ISenderOnSent {
  hash: string
  messageId: number
  receiverId: number
  createdAt: string
  status: MessageStatus.SENT
}

interface ISenderOnDelivered {
  messageId: number
  receiverId: number
  status: MessageStatus.DELIVERED
}

interface ISenderOnRead {
  messageId: number
  receiverId: number
  status: MessageStatus.DELIVERED
}

export interface IReceiverEmitDelivered {
  messageId: number
  senderId: number
  receiverId: number
}

export interface IReceiverEmitRead {
  messageId: number
  senderId: number
  receiverId: number
}

export interface ISenderEmitTyping {
  senderId: number
  receiverId: number
  isTyping: boolean
}

type IReceiverOnTyping = ISenderEmitTyping

export enum SocketEvent {
  SEND_MESSAGE = 'send-message',
  RECEIVE_MESSAGE = 'receive-message',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  TYPING = 'typing',
}

export interface SocketOnEventPayload {
  [SocketEvent.RECEIVE_MESSAGE]: IReceiverOnMessage
  [SocketEvent.SENT]: ISenderOnSent
  [SocketEvent.DELIVERED]: ISenderOnDelivered
  [SocketEvent.READ]: ISenderOnRead[]
  [SocketEvent.TYPING]: IReceiverOnTyping
}

export interface SocketEmitEventPayload {
  [SocketEvent.SEND_MESSAGE]: ISenderEmitMessage
  [SocketEvent.DELIVERED]: IReceiverEmitDelivered
  [SocketEvent.TYPING]: ISenderEmitTyping
  [SocketEvent.READ]: IReceiverEmitRead | IReceiverEmitRead[]
}

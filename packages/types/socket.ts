import type { MessageStatus } from './message'

export interface ISenderEmitMessage {
  hash: string
  content: string
  senderId: number
  receiverId: number
  status: MessageStatus.SENDING
}

export interface IReceiverOnMessage {
  messageId: number
  content: string
  senderId: number
  createdAt: string
  status: MessageStatus.SENT
}

export interface ISenderOnSent {
  hash: string
  messageId: number
  receiverId: number
  createdAt: string
  status: MessageStatus.SENT
}

export interface ISenderOnDelivered {
  messageId: number
  receiverId: number
  status: MessageStatus.DELIVERED
}

export interface ISenderOnRead {
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

export type IReceiverOnTyping = ISenderEmitTyping

export enum SocketOnEvent {
  RECEIVE_MESSAGE = 'receive-message',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  TYPING = 'typing',
}

export enum SocketEmitEvent {
  SEND_MESSAGE = 'send-message',
  DELIVERED = 'delivered',
  TYPING = 'typing',
  READ = 'read',
}

export interface SocketOnEventPayload {
  [SocketOnEvent.RECEIVE_MESSAGE]: IReceiverOnMessage
  [SocketOnEvent.SENT]: ISenderOnSent
  [SocketOnEvent.DELIVERED]: ISenderOnDelivered
  [SocketOnEvent.READ]: ISenderOnRead[]
  [SocketOnEvent.TYPING]: IReceiverOnTyping
}

export interface SocketEmitEventPayload {
  [SocketEmitEvent.SEND_MESSAGE]: ISenderEmitMessage
  [SocketEmitEvent.DELIVERED]: IReceiverEmitDelivered
  [SocketEmitEvent.TYPING]: ISenderEmitTyping
  [SocketEmitEvent.READ]: IReceiverEmitRead | IReceiverEmitRead[]
}

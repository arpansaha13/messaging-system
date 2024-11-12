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

export interface SocketOnEventPayload {
  [SocketEvents.PERSONAL.MESSAGE_RECEIVE]: IReceiverOnMessage
  [SocketEvents.PERSONAL.STATUS_SENT]: ISenderOnSent
  [SocketEvents.PERSONAL.STATUS_DELIVERED]: ISenderOnDelivered
  [SocketEvents.PERSONAL.STATUS_READ]: ISenderOnRead[]
  [SocketEvents.PERSONAL.TYPING]: IReceiverOnTyping
}

export interface SocketEmitEventPayload {
  [SocketEvents.PERSONAL.MESSAGE_SEND]: ISenderEmitMessage
  [SocketEvents.PERSONAL.STATUS_DELIVERED]: IReceiverEmitDelivered
  [SocketEvents.PERSONAL.TYPING]: ISenderEmitTyping
  [SocketEvents.PERSONAL.STATUS_READ]: IReceiverEmitRead | IReceiverEmitRead[]
}

import type { MessageStatus } from './message.types'

export interface ISessionConnect {
  userId: number
}

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

export interface SocketOnEventPayload {
  'connect': never
  'disconnect': never
  'receive-message': IReceiverOnMessage
  'sent': ISenderOnSent
  'delivered': ISenderOnDelivered
  'read': ISenderOnRead[]
  'typing': IReceiverOnTyping
}

export interface SocketEmitEventPayload {
  'session-connect': ISessionConnect
  'send-message': ISenderEmitMessage
  'delivered': IReceiverEmitDelivered
  'typing': ISenderEmitTyping
  'read': IReceiverEmitRead | IReceiverEmitRead[]
}

export type SocketOnEvent = keyof SocketOnEventPayload
export type SocketEmitEvent = keyof SocketEmitEventPayload

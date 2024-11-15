import type { MessageStatus } from '@shared/constants'
import type { IUser } from './client'

export interface IMessageSending {
  hash: string
  content: string
  senderId: IUser['id']
  status: MessageStatus.SENDING

  /** For deciding the order in which messages should be shown in chat window */
  createdInClientAt: string
}
export interface IMessage {
  id: number
  content: string
  senderId: IUser['id']
  createdAt: string
  status: Exclude<MessageStatus, MessageStatus.SENDING>
}

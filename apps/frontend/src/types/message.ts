import type { MessageStatus } from '~/constants'
import type { ChannelId, UserId } from './id'

export interface IMessageSending {
  hash: string
  content: string
  senderId: UserId
  status: MessageStatus.SENDING | MessageStatus.SENT

  /** For deciding the order in which messages should be shown in chat window */
  createdInClientAt: string
}
export interface IMessage {
  id: number
  content: string
  senderId: UserId
  createdAt: string
  status: Exclude<MessageStatus, MessageStatus.SENDING>
}

export interface IGroupMessageSending extends IMessageSending {
  channelId: ChannelId
}

export interface IGroupMessage extends IMessage {
  channelId: ChannelId
}

import type { MessageStatus } from '@shared/constants'
import type { IGroupMessage, IGroupMessageSending, IMessage, IMessageSending } from './message'
import type { ChannelId, GroupId, UserId } from './id'

export namespace SocketEventPayloads {
  export namespace Personal {
    export interface EmitMessage {
      hash: IMessageSending['hash']
      content: IMessage['content']
      senderId: UserId
      receiverId: UserId
      status: MessageStatus.SENDING
    }

    export interface OnMessage {
      messageId: IMessage['id']
      content: IMessage['content']
      senderId: UserId
      createdAt: string
      status: MessageStatus.SENT
    }

    export interface OnSent {
      hash: IMessageSending['hash']
      messageId: IMessage['id']
      receiverId: UserId
      createdAt: string
      status: MessageStatus.SENT
    }

    export interface OnDelivered {
      messageId: IMessage['id']
      receiverId: UserId
      status: MessageStatus.DELIVERED
    }

    export interface OnRead {
      messageId: IMessage['id']
      receiverId: UserId
      status: MessageStatus.DELIVERED
    }

    export interface EmitDelivered {
      messageId: IMessage['id']
      senderId: UserId
      receiverId: UserId
    }

    export interface EmitRead {
      messageId: IMessage['id']
      senderId: UserId
      receiverId: UserId
    }

    export interface EmitTyping {
      senderId: IMessage['id']
      receiverId: UserId
      isTyping: boolean
    }

    export type OnTyping = EmitTyping
  }

  export namespace Group {
    export interface EmitNewGroup {
      groupId: number

      /** Comma-separated channel ids */
      channels: string
    }

    export interface EmitJoinGroup {
      groupId: number

      /** Comma-separated channel ids */
      channels: string
    }

    export interface EmitNewChannel {
      groupId: number
      channelId: number
    }

    export interface OnNewChannel {
      groupId: number
    }

    export interface EmitMessage {
      hash: IGroupMessageSending['hash']
      content: IGroupMessage['content']
      senderId: UserId
      groupId: GroupId
      channelId: ChannelId
      status: MessageStatus.SENDING
    }

    export interface OnMessage {
      messageId: IGroupMessage['id']
      content: IGroupMessage['content']
      senderId: UserId
      groupId: GroupId
      channelId: ChannelId
      createdAt: string
      status: MessageStatus.SENT
    }

    export interface OnSent {
      hash: IMessageSending['hash']
      messageId: IMessage['id']
      groupId: GroupId
      channelId: ChannelId
      createdAt: string
      status: MessageStatus.SENT
    }

    export interface EmitDelivered {
      messageId: IMessage['id']
      receiverId: UserId
    }

    export interface EmitRead {
      messageId: IMessage['id']
      receiverId: UserId
    }
  }
}

import type { MessageStatus } from '@shared/constants'
import type { IChannel, IGroup, IUser } from './client'
import type { IGroupMessage, IGroupMessageSending, IMessage, IMessageSending } from './message'

export namespace SocketEventPayloads {
  export namespace Personal {
    export interface EmitMessage {
      hash: IMessageSending['hash']
      content: IMessage['content']
      senderId: IUser['id']
      receiverId: IUser['id']
      status: MessageStatus.SENDING
    }

    export interface OnMessage {
      messageId: IMessage['id']
      content: IMessage['content']
      senderId: IUser['id']
      createdAt: string
      status: MessageStatus.SENT
    }

    export interface OnSent {
      hash: IMessageSending['hash']
      messageId: IMessage['id']
      receiverId: IUser['id']
      createdAt: string
      status: MessageStatus.SENT
    }

    export interface OnDelivered {
      messageId: IMessage['id']
      receiverId: IUser['id']
      status: MessageStatus.DELIVERED
    }

    export interface OnRead {
      messageId: IMessage['id']
      receiverId: IUser['id']
      status: MessageStatus.DELIVERED
    }

    export interface EmitDelivered {
      messageId: IMessage['id']
      senderId: IUser['id']
      receiverId: IUser['id']
    }

    export interface EmitRead {
      messageId: IMessage['id']
      senderId: IUser['id']
      receiverId: IUser['id']
    }

    export interface EmitTyping {
      senderId: IMessage['id']
      receiverId: IUser['id']
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
      senderId: IUser['id']
      groupId: IGroup['id']
      channelId: IChannel['id']
      status: MessageStatus.SENDING
    }

    export interface OnMessage {
      messageId: IGroupMessage['id']
      content: IGroupMessage['content']
      senderId: IUser['id']
      groupId: IGroup['id']
      channelId: IChannel['id']
      createdAt: string
      status: MessageStatus.SENT
    }

    export interface OnSent {
      hash: IMessageSending['hash']
      messageId: IMessage['id']
      groupId: IGroup['id']
      channelId: IChannel['id']
      createdAt: string
      status: MessageStatus.SENT
    }

    export interface EmitDelivered {
      messageId: IMessage['id']
      receiverId: IUser['id']
    }

    export interface EmitRead {
      messageId: IMessage['id']
      receiverId: IUser['id']
    }
  }
}

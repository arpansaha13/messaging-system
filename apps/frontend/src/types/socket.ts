import type { MessageStatus } from '~/constants'
import type { IGroupMessage, IGroupMessageSending, IMessage, IMessageSending } from './message'
import type { ChannelId, GroupId, UserId } from './id'

export type SocketEventPayloads = {
  Personal: {
    EmitMessage: {
      hash: IMessageSending['hash']
      content: IMessage['content']
      senderId: UserId
      receiverId: UserId
      status: MessageStatus.SENDING
    }
    OnMessage: {
      messageId: IMessage['id']
      content: IMessage['content']
      senderId: UserId
      createdAt: string
      status: MessageStatus.SENT
    }
    OnDelivered: {
      messageId: IMessage['id']
      receiverId: UserId
      status: MessageStatus.DELIVERED
    }
    OnRead: {
      messageId: IMessage['id']
      receiverId: UserId
      status: MessageStatus.DELIVERED
    }
    EmitDelivered: {
      messageId: IMessage['id']
      senderId: UserId
      receiverId: UserId
    }
    EmitRead: {
      messageId: IMessage['id']
      senderId: UserId
      receiverId: UserId
    }
    EmitTyping: {
      senderId: IMessage['id']
      receiverId: UserId
      isTyping: boolean
    }
    OnTyping: {
      senderId: IMessage['id']
      receiverId: UserId
      isTyping: boolean
    }
    EmitCheckOnline: {
      userIds: UserId[]
    }
    OnCheckOnline: {
      statuses: Record<UserId, boolean>
    }
  }
  Group: {
    EmitNewGroup: {
      groupId: number
      /** Comma-separated channel ids */
      channels: string
    }
    EmitJoinGroup: {
      groupId: number
      /** Comma-separated channel ids */
      channels: string
    }
    EmitNewChannel: {
      groupId: number
      channelId: number
    }
    OnNewChannel: {
      id: number
      name: string
      groupId: number
      createdAt: string
    }
    EmitMessage: {
      hash: IGroupMessageSending['hash']
      content: IGroupMessage['content']
      senderId: UserId
      groupId: GroupId
      channelId: ChannelId
      status: MessageStatus.SENDING
    }
    OnMessage: {
      messageId: IGroupMessage['id']
      content: IGroupMessage['content']
      senderId: UserId
      groupId: GroupId
      channelId: ChannelId
      createdAt: string
      status: MessageStatus.SENT
    }
    OnSent: {
      hash: IMessageSending['hash']
      messageId: IMessage['id']
      groupId: GroupId
      channelId: ChannelId
      createdAt: string
      status: MessageStatus.SENT
    }
    EmitDelivered: {
      messageId: IMessage['id']
      receiverId: UserId
    }
    EmitRead: {
      messageId: IMessage['id']
      receiverId: UserId
    }
  }
}

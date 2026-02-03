import type { IChannel, IUser } from '~/types'
import type { IGroupMessage, IMessage } from '@shared/types'

export function fetchMessages(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api<IMessage[]>(`/api/messages/${receiverId}`)
}

export function fetchGroupMessages(channelId: IChannel['id']) {
  const { $api } = useNuxtApp()
  return $api<IGroupMessage[]>(`/api/messages/channel/${channelId}`)
}

export async function sendPersonalMessage(receiverId: IUser['id'], content: string, hash: string) {
  const { $api } = useNuxtApp()
  return $api('/api/messages/send/personal', {
    method: 'POST',
    body: {
      receiverId,
      content,
      hash,
    },
  })
}

export async function sendGroupMessage(groupId: number, channelId: IChannel['id'], content: string, hash: string) {
  const { $api } = useNuxtApp()
  return $api('/api/messages/send/group', {
    method: 'POST',
    body: {
      groupId,
      channelId,
      content,
      hash,
    },
  })
}

export async function handleDelivered(messageId: IMessage['id'], receiverId: IUser['id'], senderId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api('/api/messages/status/delivered', {
    method: 'POST',
    body: {
      messageId,
      receiverId,
      senderId,
    },
  })
}

export async function handleRead(
  messages: Array<{
    messageId: IMessage['id']
    senderId: IUser['id']
    receiverId: IUser['id']
  }>,
) {
  const { $api } = useNuxtApp()
  return $api('/api/messages/status/read', {
    method: 'POST',
    body: {
      messages,
    },
  })
}

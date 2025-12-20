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

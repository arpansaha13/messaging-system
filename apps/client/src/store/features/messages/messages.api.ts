import _fetch from '~/utils/api/_fetch'
import type { IMessage } from '@shared/types'
import type { IChannel, IUser } from '@shared/types/client'

export function _getMessages(receiverId: IUser['id']): Promise<IMessage[]> {
  return _fetch(`messages/${receiverId}`)
}

export function _getGroupMessages(channelId: IChannel['id']): Promise<IMessage[]> {
  return _fetch(`messages/channel/${channelId}`)
}

export function _clearMessages(receiverId: IUser['id']): Promise<void> {
  return _fetch(`chats/${receiverId}/clear`, { method: 'DELETE' })
}

import _fetch from './_fetch'
import type { IChatListItem, IUser } from '@shared/types/client'

export function _getChatsWith(receiverId: IUser['id']): Promise<IChatListItem> {
  return _fetch(`chats/${receiverId}`)
}

export function _clearMessages(receiverId: IUser['id']): Promise<void> {
  return _fetch(`chats/${receiverId}/clear`, { method: 'DELETE' })
}

export function _deleteMessages(receiverId: IUser['id']): Promise<void> {
  return _fetch(`chats/${receiverId}/delete`, { method: 'DELETE' })
}

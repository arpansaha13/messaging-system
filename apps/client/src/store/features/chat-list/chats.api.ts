import _fetch from '~/utils/api/_fetch'
import type { IChatsResponse } from '@shared/types'
import type { IUser } from '@shared/types/client'

export function _getChats(): Promise<IChatsResponse> {
  return _fetch('chats')
}

export function _archiveChat(receiverId: IUser['id']): Promise<void> {
  return _fetch(`chats/${receiverId}/archive`, { method: 'PATCH' })
}

export function _unarchiveChat(receiverId: IUser['id']): Promise<void> {
  return _fetch(`chats/${receiverId}/unarchive`, { method: 'PATCH' })
}

export function _pinChat(receiverId: IUser['id']): Promise<void> {
  return _fetch(`chats/${receiverId}/pin`, { method: 'PATCH' })
}

export function _unpinChat(receiverId: IUser['id']): Promise<void> {
  return _fetch(`chats/${receiverId}/unpin`, { method: 'PATCH' })
}

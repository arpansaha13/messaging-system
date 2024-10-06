import _fetch from './_fetch'
import type { IChatsResponse } from '@shared/types'
import type { IChatListItem, IUser } from '@shared/types/client'

export function _getChats(): Promise<IChatsResponse> {
  return _fetch('chats')
}

export function _getChatsWith(receiverId: IUser['id']): Promise<IChatListItem> {
  return _fetch(`chats/${receiverId}`)
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

export function _clearMessages(receiverId: IUser['id']): Promise<void> {
  return _fetch(`chats/${receiverId}/clear`, { method: 'DELETE' })
}

export function _deleteMessages(receiverId: IUser['id']): Promise<void> {
  return _fetch(`chats/${receiverId}/delete`, { method: 'DELETE' })
}

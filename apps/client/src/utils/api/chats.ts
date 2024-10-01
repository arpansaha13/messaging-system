import _fetch from './_fetch'
import type { IChatsResponse } from '@shared/types'
import type { IChatListItem } from '@shared/types/client'

export function _getChats(): Promise<IChatsResponse> {
  return _fetch('chats')
}

export function _getChatsWith(receiverId: number): Promise<IChatListItem> {
  return _fetch(`chats/${receiverId}`)
}

export function _archiveChat(receiverId: number): Promise<void> {
  return _fetch(`chats/${receiverId}/archive`, { method: 'PATCH' })
}

export function _unarchiveChat(receiverId: number): Promise<void> {
  return _fetch(`chats/${receiverId}/unarchive`, { method: 'PATCH' })
}

export function _pinChat(receiverId: number): Promise<void> {
  return _fetch(`chats/${receiverId}/pin`, { method: 'PATCH' })
}

export function _unpinChat(receiverId: number): Promise<void> {
  return _fetch(`chats/${receiverId}/unpin`, { method: 'PATCH' })
}

export function _clearMessages(receiverId: number): Promise<void> {
  return _fetch(`chats/${receiverId}/clear`, { method: 'DELETE' })
}

export function _deleteMessages(receiverId: number): Promise<void> {
  return _fetch(`chats/${receiverId}/delete`, { method: 'DELETE' })
}

import type { IChatListItem, IChatsResponse, IUser } from '~/types'
import type { IMessage } from '@shared/types'
import type { MessageStatus } from '@shared/constants'

export function fetchChats() {
  const { $api } = useNuxtApp()
  return $api<IChatsResponse>('/api/chats')
}

export function fetchChatByReceiver(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api<IChatListItem>(`/api/chats/${receiverId}`)
}

// Get cached chatList using useNuxtData
export function getChatListData() {
  return useNuxtData<IChatsResponse>(asyncKeys.chatList).data
}

// Helper to find chat in list
function findChatIndex(receiverId: number, list: IChatListItem[]): number {
  return list.findIndex(item => item.receiver.id === receiverId)
}

// Mutate the cached chatList data
function mutateChatListData(mutator: (state: IChatsResponse) => void) {
  const chatListData = getChatListData()
  if (!chatListData.value) return

  const current = chatListData.value
  mutator(current)

  // Trigger reactivity by reassigning
  chatListData.value = {
    archived: [...current.archived],
    unarchived: [...current.unarchived],
  }
}

// Update a specific chat item in the list
export function updateChatListItem(receiverId: number, updater: (item: IChatListItem) => void) {
  mutateChatListData(state => {
    const unarchiveIdx = findChatIndex(receiverId, state.unarchived)
    if (unarchiveIdx !== -1) {
      updater(state.unarchived[unarchiveIdx]!)
    }

    const archiveIdx = findChatIndex(receiverId, state.archived)
    if (archiveIdx !== -1) {
      updater(state.archived[archiveIdx]!)
    }
  })
}

// Sort conversation list
function sortChatList(list: IChatListItem[]) {
  list.sort((a, b) => {
    if (a.chat.pinned && !b.chat.pinned) return -1
    if (!a.chat.pinned && b.chat.pinned) return 1
    if (a.latestMsg && !b.latestMsg) return -1
    if (!a.latestMsg && b.latestMsg) return 1
    if (!a.latestMsg && !b.latestMsg) return 0
    return new Date(b.latestMsg!.createdAt).getTime() - new Date(a.latestMsg!.createdAt).getTime()
  })
}

// Initialize a new chat
export async function initializeChat(receiverId: number) {
  const chat = await fetchChatByReceiver(receiverId)
  mutateChatListData(state => {
    state.unarchived.push(chat)
    sortChatList(state.unarchived)
  })
}

// Toggle pin status
export async function togglePinChat(receiverId: number, pinned: boolean) {
  updateChatListItem(receiverId, item => {
    item.chat.pinned = pinned
  })

  mutateChatListData(state => {
    sortChatList(state.unarchived)
  })

  try {
    if (pinned) {
      await pinChat(receiverId)
    } else {
      await unpinChat(receiverId)
    }
  } catch (error) {
    console.error('Error toggling pin:', error)
  }
}

// Archive chat
export async function archiveChat(receiverId: number) {
  mutateChatListData(state => {
    const idx = findChatIndex(receiverId, state.unarchived)
    if (idx !== -1) {
      const convo = state.unarchived.splice(idx, 1)[0]!
      convo.chat.archived = true
      convo.chat.pinned = false
      state.archived.push(convo)
      sortChatList(state.archived)
    }
  })

  try {
    await archiveChatRequest(receiverId)
  } catch (error) {
    console.error('Error archiving chat:', error)
  }
}

// Unarchive chat
export async function unarchiveChat(receiverId: number) {
  mutateChatListData(state => {
    const idx = findChatIndex(receiverId, state.archived)
    if (idx !== -1) {
      const convo = state.archived.splice(idx, 1)[0]!
      convo.chat.archived = false
      state.unarchived.push(convo)
      sortChatList(state.unarchived)
    }
  })

  try {
    await unarchiveChatRequest(receiverId)
  } catch (error) {
    console.error('Error unarchiving chat:', error)
  }
}

// Delete chat
export async function deleteChatLocally(receiverId: number, archivedList: boolean) {
  mutateChatListData(state => {
    const list = archivedList ? state.archived : state.unarchived
    const idx = findChatIndex(receiverId, list)
    if (idx !== -1) {
      list.splice(idx, 1)
    }
  })

  try {
    await deleteChat(receiverId)
  } catch (error) {
    console.error('Error deleting chat:', error)
  }
}

// Clear latest message
export function clearLatestMessage(receiverId: number) {
  updateChatListItem(receiverId, item => {
    item.latestMsg = null
  })
}

// Insert new unarchived chat
export function insertUnarchivedChat(item: IChatListItem) {
  mutateChatListData(state => {
    state.unarchived.push(item)
    sortChatList(state.unarchived)
  })
}

// Update latest message
export function updateLatestMessage(receiverId: number, latestMsg: IMessage | null) {
  mutateChatListData(state => {
    const archivedIdx = findChatIndex(receiverId, state.archived)
    if (archivedIdx !== -1) {
      const convo = state.archived.splice(archivedIdx, 1)[0]!
      convo.chat.archived = false
      state.unarchived.push(convo)
    }

    const idx = findChatIndex(receiverId, state.unarchived)
    if (idx !== -1) {
      state.unarchived[idx]!.latestMsg = latestMsg
      sortChatList(state.unarchived)
    }
  })
}

// Update message status
export function updateLatestMessageStatus(
  receiverId: number,
  messageId: number,
  status: Exclude<MessageStatus, MessageStatus.SENDING>,
) {
  updateChatListItem(receiverId, item => {
    if (item.latestMsg?.id === messageId) {
      item.latestMsg.status = status
    }
  })
}

// Upsert contact
export function upsertContactInChat(receiverId: IUser['id'], newContact: { id: number; alias: string }) {
  updateChatListItem(receiverId, item => {
    if (!item.receiver.contact) {
      item.receiver.contact = { id: newContact.id, alias: newContact.alias }
    } else {
      item.receiver.contact.alias = newContact.alias
    }
  })
}

// Delete contact
export function deleteContactFromChat(receiverId: IUser['id']) {
  updateChatListItem(receiverId, item => {
    item.receiver.contact = null
  })
}

// API call utilities
async function archiveChatRequest(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api<undefined>(`/api/chats/${receiverId}/archive`, { method: 'PATCH' })
}

async function unarchiveChatRequest(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api<undefined>(`/api/chats/${receiverId}/unarchive`, { method: 'PATCH' })
}

async function pinChat(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api<undefined>(`/api/chats/${receiverId}/pin`, { method: 'PATCH' })
}

async function unpinChat(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api<undefined>(`/api/chats/${receiverId}/unpin`, { method: 'PATCH' })
}

async function deleteChat(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api<undefined>(`/api/chats/${receiverId}/delete`, { method: 'DELETE' })
}

export function clearChat(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api<undefined>(`/api/chats/${receiverId}/clear`, { method: 'DELETE' })
}

import type { IChatListItem, IUser } from '~/types'
import type { IMessage } from '@shared/types'
import type { MessageStatus } from '@shared/constants'

// =============================================
// ================= API Calls =================
// =============================================

function apiPinChat(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api(`/api/chats/${receiverId}/pin`, { method: 'PATCH' })
}

function apiUnpinChat(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api(`/api/chats/${receiverId}/unpin`, { method: 'PATCH' })
}

function apiArchiveChat(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api(`/api/chats/${receiverId}/archive`, { method: 'PATCH' })
}

function apiUnarchiveChat(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api(`/api/chats/${receiverId}/unarchive`, { method: 'PATCH' })
}

function apiDeleteChat(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api(`/api/chats/${receiverId}/delete`, { method: 'DELETE' })
}

function apiClearChat(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api(`/api/chats/${receiverId}/clear`, { method: 'DELETE' })
}

function apiFetchChatByReceiver(receiverId: IUser['id']) {
  const { $api } = useNuxtApp()
  return $api<IChatListItem>(`/api/chats/${receiverId}`)
}

// =============================================
// ================== Helpers ==================
// =============================================

export function getUnarchivedChatListData() {
  return useNuxtData<IChatListItem[]>(asyncKeys.chatListUnarchived).data
}

export function getArchivedChatListData() {
  return useNuxtData<IChatListItem[]>(asyncKeys.chatListArchived).data
}

function ensureChatLists() {
  const unarchivedData = getUnarchivedChatListData()
  const archivedData = getArchivedChatListData()

  if (!unarchivedData.value) {
    unarchivedData.value = []
  }

  if (!archivedData.value) {
    archivedData.value = []
  }

  return { unarchivedData, archivedData }
}

function mutateChatLists(mutator: (state: { unarchived: IChatListItem[]; archived: IChatListItem[] }) => void) {
  const { unarchivedData, archivedData } = ensureChatLists()

  mutator({ unarchived: unarchivedData.value!, archived: archivedData.value! })
}

/** Helper to find chat in list */
function findChatIndex(receiverId: IUser['id'], list: IChatListItem[]): number {
  return list.findIndex(item => item.receiver.id === receiverId)
}

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

// =============================================
// ============== Public Actions ===============
// =============================================

export async function initializeNewChat(receiverId: IUser['id']) {
  const chat = await apiFetchChatByReceiver(receiverId)
  mutateChatLists(state => {
    state.unarchived.push(chat)
    sortChatList(state.unarchived)
  })
}

/** Update a specific chat item in the list */
export function updateChatListItem(receiverId: IUser['id'], updater: (item: IChatListItem) => void) {
  mutateChatLists(state => {
    const unarchivedIdx = findChatIndex(receiverId, state.unarchived)
    if (unarchivedIdx !== -1) {
      updater(state.unarchived[unarchivedIdx]!)
      return
    }

    const archivedIdx = findChatIndex(receiverId, state.archived)
    if (archivedIdx !== -1) {
      updater(state.archived[archivedIdx]!)
    }
  })
}

export async function togglePinChat(receiverId: IUser['id'], pinned: boolean) {
  updateChatListItem(receiverId, item => {
    item.chat.pinned = pinned
  })

  mutateChatLists(state => {
    sortChatList(state.unarchived)
  })

  try {
    if (pinned) {
      await apiPinChat(receiverId)
    } else {
      await apiUnpinChat(receiverId)
    }
  } catch (error) {
    console.error('Error toggling pin:', error)
  }
}

export async function archiveChat(receiverId: IUser['id']) {
  mutateChatLists(state => {
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
    await apiArchiveChat(receiverId)
  } catch (error) {
    // TODO: Rollback
    console.error('Error archiving chat:', error)
  }
}

export async function unarchiveChat(receiverId: IUser['id']) {
  mutateChatLists(state => {
    const idx = findChatIndex(receiverId, state.archived)
    if (idx !== -1) {
      const convo = state.archived.splice(idx, 1)[0]!
      convo.chat.archived = false
      state.unarchived.push(convo)
      sortChatList(state.unarchived)
    }
  })

  try {
    await apiUnarchiveChat(receiverId)
  } catch (error) {
    // TODO: Rollback
    console.error('Error unarchiving chat:', error)
  }
}

/**
 * Deletes a personal chat.
 *
 * No optimistic updates. `DeleteChatModal` shows a loader during deletion.
 */
export async function deleteChat(receiverId: IUser['id'], archivedList: boolean) {
  try {
    await apiDeleteChat(receiverId)
    mutateChatLists(state => {
      const list = archivedList ? state.archived : state.unarchived
      const idx = findChatIndex(receiverId, list)
      if (idx !== -1) {
        list.splice(idx, 1)
      }
    })
  } catch (error) {
    console.error('Error deleting chat:', error)
  }
}

export function clearLatestMessageFromChatList(receiverId: IUser['id']) {
  updateChatListItem(receiverId, item => {
    item.latestMsg = null
  })
}

export function insertNewUnarchivedChat(item: IChatListItem) {
  mutateChatLists(state => {
    state.unarchived.push(item)
    sortChatList(state.unarchived)
  })
}

export function updateLatestMessageInChatList(receiverId: IUser['id'], latestMsg: IMessage | null) {
  mutateChatLists(state => {
    const archivedIdx = findChatIndex(receiverId, state.archived)
    if (archivedIdx !== -1) {
      const convo = state.archived.splice(archivedIdx, 1)[0]!
      convo.chat.archived = false
      state.unarchived.push(convo)
    }

    const unarchivedIdx = findChatIndex(receiverId, state.unarchived)
    if (unarchivedIdx !== -1) {
      state.unarchived[unarchivedIdx]!.latestMsg = latestMsg
      sortChatList(state.unarchived)
    }
  })
}

export function updateLatestMessageStatusInChatList(
  receiverId: IUser['id'],
  messageId: number,
  status: Exclude<MessageStatus, MessageStatus.SENDING>,
) {
  updateChatListItem(receiverId, item => {
    if (item.latestMsg?.id === messageId) {
      item.latestMsg.status = status
    }
  })
}

export function upsertContactInChatList(
  receiverId: IUser['id'],
  newContact: NonNullable<IChatListItem['receiver']['contact']>,
) {
  updateChatListItem(receiverId, item => {
    if (item.receiver.contact) {
      item.receiver.contact.alias = newContact.alias
    } else {
      item.receiver.contact = { ...newContact }
    }
  })
}

export function deleteContactFromChatList(receiverId: IUser['id']) {
  updateChatListItem(receiverId, item => {
    item.receiver.contact = null
  })
}

export function clearChat(receiverId: IUser['id']) {
  return apiClearChat(receiverId)
}

export async function maybeClearActiveChat(receiverId: IUser['id']) {
  const route = useRoute()

  const query = { ...route.query }
  const currentId = query.to ? Number(query.to as string) : null

  if (currentId === receiverId) {
    delete query.to
    await navigateTo({ path: route.path, query }, { replace: true })
  }
}

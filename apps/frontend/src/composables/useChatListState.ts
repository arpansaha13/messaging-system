import type { IChatListItem, IContact, IChatsResponse, IUser } from '~/types'
import type { IMessage } from '@shared/types'
import type { MessageStatus } from '@shared/constants'
import {
  archiveChat as archiveChatRequest,
  deleteChat as deleteChatRequest,
  fetchChatByReceiver,
  pinChat,
  unarchiveChat as unarchiveChatRequest,
  unpinChat,
} from '~/services/chats'

export async function useChatListState() {
  const chatList = await useFetchChats()

  const archived = computed(() => chatList.data.value?.archived ?? [])
  const unarchived = computed(() => chatList.data.value?.unarchived ?? [])

  function mutateState(mutator: (state: IChatsResponse) => void) {
    const current = chatList.data.value ?? { archived: [], unarchived: [] }
    mutator(current)
    chatList.data.value = {
      archived: [...current.archived],
      unarchived: [...current.unarchived],
    }
  }

  function updateChatListItem(receiverId: number, updater: (item: IChatListItem) => void) {
    mutateState(state => {
      const idx = findRoomIndex(receiverId, state.unarchived)
      if (idx !== null) {
        updater(state.unarchived[idx])
      }
      const archivedIdx = findRoomIndex(receiverId, state.archived)
      if (archivedIdx !== null) {
        updater(state.archived[archivedIdx])
      }
    })
  }

  async function initializeChat(receiverId: number) {
    const chat = await fetchChatByReceiver(receiverId)
    mutateState(state => {
      state.unarchived.push(chat)
      sortConvo(state.unarchived)
    })
  }

  async function togglePin(receiverId: number, pinned: boolean) {
    updateChatListItem(receiverId, item => {
      item.chat.pinned = pinned
    })
    mutateState(state => {
      sortConvo(state.unarchived)
    })
    if (pinned) {
      await pinChat(receiverId)
    } else {
      await unpinChat(receiverId)
    }
  }

  async function archive(receiverId: number) {
    mutateState(state => {
      const idx = findRoomIndex(receiverId, state.unarchived)
      if (idx === null) return
      const convo = state.unarchived.splice(idx, 1)[0]
      convo.chat.archived = true
      convo.chat.pinned = false
      state.archived.push(convo)
      sortConvo(state.archived)
    })
    await archiveChatRequest(receiverId)
  }

  async function unarchive(receiverId: number) {
    mutateState(state => {
      const idx = findRoomIndex(receiverId, state.archived)
      if (idx === null) return
      const convo = state.archived.splice(idx, 1)[0]
      convo.chat.archived = false
      state.unarchived.push(convo)
      sortConvo(state.unarchived)
    })
    await unarchiveChatRequest(receiverId)
  }

  async function deleteChat(receiverId: number, archivedList: boolean) {
    mutateState(state => {
      const list = archivedList ? state.archived : state.unarchived
      const idx = findRoomIndex(receiverId, list)
      if (idx !== null) {
        list.splice(idx, 1)
      }
    })
    await deleteChatRequest(receiverId)
  }

  function clearLatestMessage(receiverId: number) {
    updateChatListItem(receiverId, item => {
      item.latestMsg = null
    })
  }

  function insertUnarchivedChat(item: IChatListItem) {
    mutateState(state => {
      state.unarchived.push(item)
      sortConvo(state.unarchived)
    })
  }

  function updateLatestMessage(receiverId: number, latestMsg: IMessage | null) {
    mutateState(state => {
      const archivedIdx = findRoomIndex(receiverId, state.archived)
      if (archivedIdx !== null) {
        const convo = state.archived.splice(archivedIdx, 1)[0]
        convo.chat.archived = false
        state.unarchived.push(convo)
      }
      const idx = findRoomIndex(receiverId, state.unarchived)
      if (idx !== null) {
        state.unarchived[idx].latestMsg = latestMsg
        sortConvo(state.unarchived)
      }
    })
  }

  function updateLatestMessageStatus(
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

  function upsertContact(receiverId: IUser['id'], newContact: Pick<IContact, 'id' | 'alias'>) {
    updateChatListItem(receiverId, item => {
      if (!item.receiver.contact) {
        item.receiver.contact = { id: newContact.id, alias: newContact.alias }
      } else {
        item.receiver.contact.alias = newContact.alias
      }
    })
  }

  function deleteContact(receiverId: IUser['id']) {
    updateChatListItem(receiverId, item => {
      item.receiver.contact = null
    })
  }

  return {
    archived,
    unarchived,
    refreshChatList: chatList.refresh,
    initializeChat,
    togglePin,
    archive,
    unarchive,
    deleteChat,
    clearLatestMessage,
    insertUnarchivedChat,
    updateLatestMessage,
    updateLatestMessageStatus,
    upsertContact,
    deleteContact,
  }
}

function findRoomIndex(receiverId: number, list: IChatListItem[]) {
  const idx = list.findIndex(item => item.receiver.id === receiverId)
  return idx === -1 ? null : idx
}

function sortConvo(list: IChatListItem[]) {
  list.sort((a, b) => {
    if (a.chat.pinned && !b.chat.pinned) return -1
    if (!a.chat.pinned && b.chat.pinned) return 1
    if (a.latestMsg && !b.latestMsg) return -1
    if (!a.latestMsg && b.latestMsg) return 1
    if (!a.latestMsg && !b.latestMsg) return 0
    return new Date(b.latestMsg!.createdAt).getTime() - new Date(a.latestMsg!.createdAt).getTime()
  })
}

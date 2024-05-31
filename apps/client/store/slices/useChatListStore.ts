import _fetch from '~/utils/_fetch'
import { isNullOrUndefined } from '@arpansaha13/utils'
import type { Slice } from '~/store/types.store'
import type { IChatListItem, IContact, MessageStatus } from '@pkg/types'

type ChatsResponse = {
  archived: IChatListItem
  unarchived: IChatListItem
}

export interface ChatListStoreType {
  unarchived: IChatListItem[]
  archived: IChatListItem[]

  activeChat: Pick<IChatListItem, 'receiver' | 'contact'> | null

  getActiveChat: () => ChatListStoreType['activeChat']

  setActiveChat: (newChatInfo: ChatListStoreType['activeChat']) => void

  upsertActiveChatContact: (receiverId: number, newContact: Pick<IContact, 'contactId' | 'alias'>) => void

  initChatList: () => Promise<void>

  insertUnarchivedChat: (newItem: IChatListItem) => void

  updateChatListItemMessage: (receiverId: number, latestMsg: IChatListItem['latestMsg']) => void

  updateChatListItemMessageStatus: (
    receiverId: number,
    messageId: number,
    latestMsgStatus: Exclude<MessageStatus, MessageStatus.SENDING>,
  ) => void

  updateChatListItemMessagePin: (receiverId: number, pinned: boolean) => void

  upsertChatListItemContact: (receiverId: number, newContact: Pick<IContact, 'contactId' | 'alias'>) => void

  clearChatListItemMessage: (receiverId: number) => void

  searchChat: (receiverId: number) => IChatListItem | null

  archiveChat: (receiverId: number) => void

  unarchiveChat: (receiverId: number) => void

  deleteChat: (receiverId: number, archived?: boolean) => void
}

export const useChatListStore: Slice<ChatListStoreType> = (set, get) => ({
  unarchived: [],

  archived: [],

  activeChat: null,

  getActiveChat() {
    return get().activeChat
  },

  setActiveChat(activeChat) {
    set({ activeChat })
  },

  upsertActiveChatContact(receiverId, newContact) {
    set(state => {
      if (isNullOrUndefined(state.activeChat)) return
      if (state.activeChat.receiver.id !== receiverId) return

      if (isNullOrUndefined(state.activeChat.contact)) {
        state.activeChat.contact = {
          id: newContact.contactId,
          alias: newContact.alias,
        }
      } else {
        state.activeChat.contact.alias = newContact.alias
      }
    })
  },

  async initChatList() {
    const { unarchived, archived }: ChatsResponse = await _fetch('chats')
    set(() => ({ unarchived, archived }))
  },

  insertUnarchivedChat(newItem) {
    set(state => {
      state.unarchived.push(newItem)
      state.unarchived.sort(sortConvoCompareFn)
    })
  },

  updateChatListItemMessage(receiverId, latestMsg) {
    set(state => {
      let idx = findRoomIndex(receiverId, state.archived)
      if (idx !== null) {
        let convoItem = state.archived.splice(idx, 1)[0] as unknown as IChatListItem
        convoItem.chat.archived = false
        state.unarchived.push(convoItem)
        _fetch(`chats/${receiverId}/unarchive`, { method: 'PATCH' })
      }
      idx = findRoomIndex(receiverId, state.unarchived)
      if (idx !== null) {
        let convoItem = state.unarchived[idx]
        convoItem.latestMsg = latestMsg
        state.unarchived.sort(sortConvoCompareFn)
      }
    })
  },

  updateChatListItemMessageStatus(receiverId, messageId, latestMsgStatus) {
    set(state => {
      let idx = findRoomIndex(receiverId, state.unarchived)
      if (idx !== null) {
        const latestMsg = state.unarchived[idx].latestMsg!
        if (latestMsg.id === messageId) latestMsg.status = latestMsgStatus
        return
      }

      idx = findRoomIndex(receiverId, state.archived)!
      if (idx !== null) {
        const latestMsg = state.archived[idx].latestMsg!
        if (latestMsg.id === messageId) latestMsg.status = latestMsgStatus
      }
    })
  },

  updateChatListItemMessagePin(receiverId, pinned) {
    set(state => {
      const idx = findRoomIndex(receiverId, state.unarchived)
      if (idx === null) return
      const convo = state.unarchived[idx]
      convo.chat.pinned = pinned
      state.unarchived.sort(sortConvoCompareFn)
      if (pinned) _fetch(`chats/${receiverId}/pin`, { method: 'PATCH' })
      else _fetch(`chats/${receiverId}/unpin`, { method: 'PATCH' })
    })
  },

  upsertChatListItemContact(receiverId, newContact) {
    set(state => {
      let idx = findRoomIndex(receiverId, state.unarchived)
      let convo: IChatListItem

      if (idx === null) {
        idx = findRoomIndex(receiverId, state.archived)!
        if (idx === null) return
        convo = state.archived[idx]
      } else {
        convo = state.unarchived[idx]
      }

      if (isNullOrUndefined(convo.contact)) {
        convo.contact = { id: newContact.contactId, alias: newContact.alias }
      } else {
        convo.contact.alias = newContact.alias
      }
    })
  },

  clearChatListItemMessage(receiverId) {
    set(state => {
      let idx = findRoomIndex(receiverId, state.unarchived)
      if (idx !== null) state.unarchived[idx].latestMsg = null

      idx = findRoomIndex(receiverId, state.archived)
      if (idx !== null) state.archived[idx].latestMsg = null
    })
  },

  searchChat(receiverId) {
    const convo = get().unarchived
    let idx = convo.findIndex(item => item.receiver.id === receiverId)
    if (idx !== -1) return convo[idx]

    const archived = get().archived
    idx = archived.findIndex(item => item.receiver.id === receiverId)
    if (idx !== -1) return archived[idx]

    return null
  },

  archiveChat(receiverId) {
    set(state => {
      const idx = findRoomIndex(receiverId, state.unarchived)
      if (idx === null) return
      const convo = state.unarchived.splice(idx, 1)[0] as unknown as IChatListItem
      convo.chat.archived = true
      if (convo.chat.pinned) {
        convo.chat.pinned = false
        _fetch(`chats/${receiverId}/unpin`, { method: 'PATCH' })
      }
      state.archived.push(convo)
      state.archived.sort(sortConvoCompareFn)
      _fetch(`chats/${receiverId}/archive`, { method: 'PATCH' })
    })
  },

  unarchiveChat(receiverId) {
    set(state => {
      const idx = findRoomIndex(receiverId, state.archived)
      if (idx === null) return
      const convo = state.archived.splice(idx, 1)[0] as unknown as IChatListItem
      convo.chat.archived = false
      state.unarchived.push(convo)
      state.unarchived.sort(sortConvoCompareFn)
      _fetch(`chats/${receiverId}/unarchive`, { method: 'PATCH' })
    })
  },

  deleteChat(receiverId, archived = false) {
    set(state => {
      const list = archived ? state.archived : state.unarchived
      const idx = findRoomIndex(receiverId, list)
      if (idx === null) return
      list.splice(idx, 1)
      // _fetch(`chats/${receiverId}/delete`, { method: 'DELETE' })
    })
  },
})

function findRoomIndex(receiverId: number, list: ReadonlyArray<IChatListItem>): number | null {
  const idx = list.findIndex(val => val.receiver.id === receiverId)
  if (idx === -1) return null
  return idx
}

const sortConvoCompareFn = (a: Readonly<IChatListItem>, b: Readonly<IChatListItem>) => {
  // Pinned chats on top
  if (a.chat.pinned && !b.chat.pinned) return -1
  if (!a.chat.pinned && b.chat.pinned) return 1

  // Cleared convo's at bottom
  if (a.latestMsg !== null && b.latestMsg === null) return -1
  if (a.latestMsg === null && b.latestMsg !== null) return 1
  if (a.latestMsg === null && b.latestMsg === null) return 0

  // Latest convo on top
  if (new Date(a.latestMsg!.createdAt) > new Date(b.latestMsg!.createdAt)) return -1
  if (new Date(a.latestMsg!.createdAt) < new Date(b.latestMsg!.createdAt)) return 1
  return 0
}

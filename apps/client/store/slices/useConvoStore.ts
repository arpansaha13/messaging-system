import _fetch from '~/utils/_fetch'
import type { Slice } from '~/store/types.store'
import type { ConvoItemType, MessageStatus } from '@pkg/types'

type ConvoResponse = {
  archived: ConvoItemType
  unarchived: ConvoItemType
}

export interface ConvoStoreType {
  unarchived: ConvoItemType[]
  archived: ConvoItemType<true>[]

  initConvo: () => Promise<void>

  updateConvo: (receiverId: number, latestMsg: ConvoItemType['latestMsg']) => void
  updateConvoStatus: (receiverId: number, latestMsgStatus: MessageStatus, senderId: number) => void

  /**
   * Search if a chat exists with the given user.
   * @returns the chat if the chat exists, else `null`.
   */
  searchConvo: (receiverId: number) => ConvoItemType<boolean> | null

  addConvo: (newItem: ConvoItemType) => void
  deleteConvo: (chatId: number, archived?: boolean) => void

  clearConvoLatestMsg: (receiverId: number) => void

  archiveRoom: (chatId: number) => void
  unarchiveRoom: (chatId: number) => void
  updateConvoPin: (chatId: number, pinned: boolean) => void
}

export const useConvoStore: Slice<ConvoStoreType> = (set, get) => ({
  unarchived: [],

  archived: [],

  async initConvo() {
    const { unarchived, archived }: ConvoResponse = await _fetch('chats')
    set(() => ({ unarchived, archived }))
  },

  updateConvo(receiverId, latestMsg) {
    set((state: ConvoStoreType) => {
      let idx = findRoomIndex(receiverId, state.archived)
      let convoItem: ConvoItemType<boolean> | null = null
      if (idx !== null) {
        convoItem = state.archived.splice(idx, 1)[0] as unknown as ConvoItemType<false>
        convoItem.chat.archived = false
        convoItem.latestMsg = latestMsg
        pushAndSort(state.unarchived, convoItem)
        _fetch(`user-to-chat/${receiverId}/unarchive`, { method: 'PATCH' })
        return
      }
      idx = findRoomIndex(receiverId, state.unarchived)
      if (idx !== null) {
        convoItem = state.unarchived.splice(idx, 1)[0]
        convoItem.latestMsg = latestMsg
        pushAndSort(state.unarchived, convoItem)
      }
    })
  },

  updateConvoStatus(receiverId, latestMsgStatus, senderId) {
    set((state: ConvoStoreType) => {
      let idx = findRoomIndex(receiverId, state.unarchived)
      if (idx !== null) {
        const latestMsg = state.unarchived[idx].latestMsg!
        if (latestMsg.senderId === senderId) latestMsg.status = latestMsgStatus
        return
      }
      idx = findRoomIndex(receiverId, state.archived)!
      state.archived[idx].latestMsg!.status = latestMsgStatus
    })
  },

  clearConvoLatestMsg(receiverId) {
    set((state: ConvoStoreType) => {
      let idx = findRoomIndex(receiverId, state.unarchived)
      if (idx !== null) state.unarchived[idx].latestMsg = null

      idx = findRoomIndex(receiverId, state.archived)
      if (idx !== null) state.archived[idx].latestMsg = null
    })
  },

  searchConvo(receiverId) {
    const convo = get().unarchived
    let idx = convo.findIndex(item => item.receiver.id === receiverId)
    if (idx !== -1) return convo[idx]

    const archived = get().archived
    idx = archived.findIndex(item => item.receiver.id === receiverId)
    if (idx !== -1) return archived[idx]

    return null
  },

  addConvo(newItem) {
    set((state: ConvoStoreType) => {
      pushAndSort(state.unarchived, newItem)
    })
  },

  archiveRoom(receiverId) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(receiverId, state.unarchived)
      if (idx === null) return null
      const convo = state.unarchived.splice(idx, 1)[0] as unknown as ConvoItemType<true>
      convo.chat.archived = true
      convo.chat.pinned = false
      pushAndSort(state.archived, convo)
      _fetch(`chats/${receiverId}/archive`, { method: 'PATCH' })
    })
  },

  unarchiveRoom(receiverId) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(receiverId, state.archived)
      if (idx === null) return null
      const convoItem = state.archived.splice(idx, 1)[0] as unknown as ConvoItemType<false>
      convoItem.chat.archived = false
      pushAndSort(state.unarchived, convoItem)
      _fetch(`chats/${receiverId}/unarchive`, { method: 'PATCH' })
    })
  },

  deleteConvo(receiverId, archived = false) {
    set((state: ConvoStoreType) => {
      const list = archived ? state.archived : state.unarchived
      const idx = findRoomIndex(receiverId, list)
      if (idx === null) return null
      list.splice(idx, 1)
      // _fetch(`chats/${receiverId}/delete`, { method: 'DELETE' })
    })
  },

  updateConvoPin(receiverId, pinned) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(receiverId, state.unarchived)
      if (idx === null) return null
      const convo = state.unarchived[idx]
      convo.chat.pinned = pinned
      state.unarchived.sort(sortConvoCompareFn)
      if (pinned) _fetch(`chats/${receiverId}/pin-chat`, { method: 'PATCH' })
      else _fetch(`chats/${receiverId}/unpin-chat`, { method: 'PATCH' })
    })
  },
})

function findRoomIndex(receiverId: number, list: ReadonlyArray<ConvoItemType<boolean>>): number | null {
  const idx = list.findIndex(val => val.receiver.id === receiverId)
  if (idx === -1) return null
  return idx
}

function pushAndSort(list: ConvoItemType<boolean>[], item: Readonly<ConvoItemType<boolean>>): void {
  list.push(item)
  list.sort(sortConvoCompareFn)
}

const sortConvoCompareFn = (a: Readonly<ConvoItemType<boolean>>, b: Readonly<ConvoItemType<boolean>>) => {
  // Pinned chats on top
  if (a.chat.pinned && !b.chat.pinned) return -1
  if (!a.chat.pinned && b.chat.pinned) return 1

  // Cleared convo's at bottom
  if (a.latestMsg !== null && b.latestMsg === null) return -1
  if (a.latestMsg === null && b.latestMsg !== null) return 1
  if (a.latestMsg === null && b.latestMsg === null) return 0

  // Latest convo on top
  if (a.latestMsg!.createdAt > b.latestMsg!.createdAt) return -1
  if (a.latestMsg!.createdAt < b.latestMsg!.createdAt) return 1
  return 0
}

import _fetch from '~/utils/_fetch'
import type { Slice } from '~/store/types.store'
import type { ConvoItemType, MessageStatus } from '@pkg/types'

type ActiveChat = Pick<ConvoItemType<boolean>['chat'], 'id' | 'archived'> | null

type ConvoResponse = {
  archived: ConvoItemType
  unarchived: ConvoItemType
}

export interface ConvoStoreType {
  /** The currently active chat-chat. */
  activeRoom: ActiveChat
  /** Set new chat - can be used to open/change to a new chat. */
  setActiveRoom: (chat: ActiveChat) => void
  getActiveRoom: () => ActiveChat

  unarchived: ConvoItemType[]
  archived: ConvoItemType<true>[]
  initConvo: () => Promise<void>

  isProxyConvo: boolean
  setProxyConvo: (proxyConvoState: boolean) => void

  updateConvoItem: (roomId: number, latestMsg: ConvoItemType['latestMsg']) => void

  updateConvoItemStatus: (roomId: number, latestMsgStatus: MessageStatus, senderId: number) => void

  /**
   * Search if a chat exists with the given user.
   * @returns the chat if the chat exists, else `null`.
   */
  searchConvoByUserId: (userId: number) => ConvoItemType<boolean> | null

  addNewConvoItem: (newItem: ConvoItemType) => void

  clearConvoItemLatestMsg: (roomId: number) => void

  archiveRoom: (roomId: number) => void
  unarchiveRoom: (roomId: number) => void
  deleteConvo: (roomId: number, archived?: boolean) => void
  updateConvoPin: (roomId: number, pinned: boolean) => void
}

export const useConvoStore: Slice<ConvoStoreType> = (set, get) => ({
  activeRoom: null,
  setActiveRoom(chat) {
    set({ activeRoom: chat })
  },
  getActiveRoom() {
    return get().activeRoom
  },
  unarchived: [],
  archived: [],
  async initConvo() {
    const { unarchived, archived }: ConvoResponse = await _fetch('chats')
    set(() => ({ unarchived, archived }))
  },
  isProxyConvo: false,
  setProxyConvo(proxyConvoState) {
    set(() => ({ isProxyConvo: proxyConvoState }))
  },
  updateConvoItem(roomId, latestMsg) {
    set((state: ConvoStoreType) => {
      let idx = findRoomIndex(roomId, state.archived)
      let convoItem: ConvoItemType<boolean> | null = null
      if (idx !== null) {
        convoItem = state.archived.splice(idx, 1)[0] as unknown as ConvoItemType<false>
        convoItem.chat.archived = false
        convoItem.latestMsg = latestMsg
        pushAndSort(state.unarchived, convoItem)
        _fetch(`user-to-chat/${roomId}/unarchive`, { method: 'PATCH' })
        return
      }
      idx = findRoomIndex(roomId, state.unarchived)
      if (idx !== null) {
        convoItem = state.unarchived.splice(idx, 1)[0]
        convoItem.latestMsg = latestMsg
        pushAndSort(state.unarchived, convoItem)
      }
    })
  },
  updateConvoItemStatus(roomId, latestMsgStatus, senderId) {
    set((state: ConvoStoreType) => {
      let idx = findRoomIndex(roomId, state.unarchived)
      if (idx !== null) {
        const latestMsg = state.unarchived[idx].latestMsg!
        if (latestMsg.senderId === senderId) latestMsg.status = latestMsgStatus
        return
      }
      idx = findRoomIndex(roomId, state.archived)!
      state.archived[idx].latestMsg!.status = latestMsgStatus
    })
  },
  clearConvoItemLatestMsg(roomId) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(roomId, state.unarchived)
      if (idx === null) return null
      state.unarchived[idx].latestMsg = null
    })
  },
  searchConvoByUserId(userId) {
    const convo = get().unarchived
    let idx = convo.findIndex(item => item.receiver.id === userId)
    if (idx !== -1) return convo[idx]

    const archived = get().archived
    idx = archived.findIndex(item => item.receiver.id === userId)
    if (idx !== -1) return archived[idx]

    return null
  },
  addNewConvoItem(newItem) {
    set((state: ConvoStoreType) => {
      pushAndSort(state.unarchived, newItem)
    })
  },
  archiveRoom(roomId) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(roomId, state.unarchived)
      if (idx === null) return null
      const convoItem = state.unarchived.splice(idx, 1)[0] as unknown as ConvoItemType<true>
      convoItem.chat.archived = true
      convoItem.chat.pinned = false
      pushAndSort(state.archived, convoItem)
      _fetch(`user-to-chat/${roomId}/archive`, { method: 'PATCH' })
    })
  },
  unarchiveRoom(roomId) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(roomId, state.archived)
      if (idx === null) return null
      const convoItem = state.archived.splice(idx, 1)[0] as unknown as ConvoItemType<false>
      convoItem.chat.archived = false
      pushAndSort(state.unarchived, convoItem)
      _fetch(`user-to-chat/${roomId}/unarchive`, { method: 'PATCH' })
    })
  },
  deleteConvo(roomId, archived = false) {
    set((state: ConvoStoreType) => {
      const list = archived ? state.archived : state.unarchived
      const idx = findRoomIndex(roomId, list)
      if (idx === null) return null
      list.splice(idx, 1)
    })
  },
  updateConvoPin(roomId, pinned) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(roomId, state.unarchived)
      if (idx === null) return null
      const convoItem = state.unarchived[idx]
      convoItem.chat.pinned = pinned
      state.unarchived.sort(sortConvoCompareFn)
      if (pinned) _fetch(`user-to-chat/${roomId}/pin-chat`, { method: 'PATCH' })
      else _fetch(`user-to-chat/${roomId}/unpin-chat`, { method: 'PATCH' })
    })
  },
})

function findRoomIndex(roomId: number, list: ReadonlyArray<ConvoItemType<boolean>>): number | null {
  const idx = list.findIndex(val => val.chat.id === roomId)
  if (idx === -1) {
    console.warn('Room does not exist.')
    return null
  }
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

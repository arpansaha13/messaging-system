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
  updateConvoStatus: (
    receiverId: number,
    messageId: number,
    latestMsgStatus: Exclude<MessageStatus, MessageStatus.SENDING>,
  ) => void

  /**
   * Search if a chat exists with the given user.
   * @returns the chat if the chat exists, else `null`.
   */
  searchConvo: (receiverId: number) => ConvoItemType<boolean> | null

  addConvo: (newItem: ConvoItemType) => void
  deleteConvo: (receiverId: number, archived?: boolean) => void

  clearConvoLatestMsg: (receiverId: number) => void

  archiveRoom: (receiverId: number) => void
  unarchiveRoom: (receiverId: number) => void
  updateConvoPin: (receiverId: number, pinned: boolean) => void
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
      if (idx !== null) {
        let convoItem = state.archived.splice(idx, 1)[0] as unknown as ConvoItemType<false>
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

  updateConvoStatus(receiverId, messageId, latestMsgStatus) {
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

  clearConvoLatestMsg(receiverId) {
    set(state => {
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
      state.unarchived.push(newItem)
      state.unarchived.sort(sortConvoCompareFn)
    })
  },

  archiveRoom(receiverId) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(receiverId, state.unarchived)
      if (idx === null) return
      const convo = state.unarchived.splice(idx, 1)[0] as unknown as ConvoItemType<true>
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

  unarchiveRoom(receiverId) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(receiverId, state.archived)
      if (idx === null) return
      const convo = state.archived.splice(idx, 1)[0] as unknown as ConvoItemType<false>
      convo.chat.archived = false
      state.unarchived.push(convo)
      state.unarchived.sort(sortConvoCompareFn)
      _fetch(`chats/${receiverId}/unarchive`, { method: 'PATCH' })
    })
  },

  deleteConvo(receiverId, archived = false) {
    set((state: ConvoStoreType) => {
      const list = archived ? state.archived : state.unarchived
      const idx = findRoomIndex(receiverId, list)
      if (idx === null) return
      list.splice(idx, 1)
      // _fetch(`chats/${receiverId}/delete`, { method: 'DELETE' })
    })
  },

  updateConvoPin(receiverId, pinned) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(receiverId, state.unarchived)
      if (idx === null) return
      const convo = state.unarchived[idx]
      convo.chat.pinned = pinned
      state.unarchived.sort(sortConvoCompareFn)
      if (pinned) _fetch(`chats/${receiverId}/pin`, { method: 'PATCH' })
      else _fetch(`chats/${receiverId}/unpin`, { method: 'PATCH' })
    })
  },
})

function findRoomIndex(receiverId: number, list: ReadonlyArray<ConvoItemType<boolean>>): number | null {
  const idx = list.findIndex(val => val.receiver.id === receiverId)
  if (idx === -1) return null
  return idx
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
  if (new Date(a.latestMsg!.createdAt) > new Date(b.latestMsg!.createdAt)) return -1
  if (new Date(a.latestMsg!.createdAt) < new Date(b.latestMsg!.createdAt)) return 1
  return 0
}

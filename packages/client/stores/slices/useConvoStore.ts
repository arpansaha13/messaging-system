import type { StateCreator } from 'zustand'
import produce from 'immer'

import type { ConvoItemType, MessageStatus } from '../../types/index.types'

type ActiveRoom = Pick<ConvoItemType<boolean>['room'], 'id' | 'archived'> | null

export interface ConvoStoreType {
  /** The currently active chat-room. */
  activeRoom: ActiveRoom
  /** Set new room - can be used to open/change to a new chat. */
  setActiveRoom: (room: ActiveRoom) => void
  getActiveRoom: () => ActiveRoom

  /** The list of unarchived chats with different users displayed on the sidebar. */
  convo: ConvoItemType[]

  initUnarchivedConvo: (initConvo: ConvoItemType[]) => void

  isProxyConvo: boolean
  setProxyConvo: (proxyConvoState: boolean) => void

  updateConvoItem: (roomId: number, latestMsg: ConvoItemType['latestMsg']) => void

  updateConvoItemStatus: (roomId: number, latestMsgStatus: MessageStatus) => void

  /**
   * Search if a room exists with the given user.
   * @returns the room if the room exists, else `null`.
   */
  searchConvoByUserId: (userId: number) => ConvoItemType<boolean>['room'] | null

  addNewConvoItem: (newItem: ConvoItemType) => void

  clearConvoItemLatestMsg: (roomId: number) => void

  archivedConvo: ConvoItemType<true>[]

  /** Initialize the archived chat list. */
  initArchivedConvo: (initConvo: ConvoItemType<true>[]) => void

  archiveRoom: (roomId: number) => void
  unarchiveRoom: (roomId: number) => void
  deleteConvo: (roomId: number, archived?: boolean) => void
  /** Used for pin-chat */
  pinConvo: (roomId: number) => void
  /** Used for unpin-chat */
  unpinConvo: (roomId: number) => void
}

export const useConvoStore: StateCreator<ConvoStoreType, [], [], ConvoStoreType> = (set, get) => ({
  activeRoom: null,
  setActiveRoom(room) {
    set({ activeRoom: room })
  },
  getActiveRoom() {
    return get().activeRoom
  },
  convo: [],
  initUnarchivedConvo(initConvo) {
    set(() => ({ convo: initConvo }))
  },
  archivedConvo: [],
  initArchivedConvo(initConvo) {
    set(() => ({ archivedConvo: initConvo }))
  },
  isProxyConvo: false,
  setProxyConvo(proxyConvoState) {
    set(() => ({ isProxyConvo: proxyConvoState }))
  },
  updateConvoItem(roomId, latestMsg) {
    set(
      produce((state: ConvoStoreType) => {
        const idx = findRoomIndex(roomId, state.convo)
        if (idx === null) return null
        const convoItem = state.convo.splice(idx, 1)[0]
        convoItem.latestMsg = latestMsg
        pushAndSort(state.convo, convoItem)
      }),
    )
  },
  updateConvoItemStatus(roomId, latestMsgStatus) {
    set(
      produce((state: ConvoStoreType) => {
        const idx = findRoomIndex(roomId, state.convo)!
        state.convo[idx].latestMsg!.status = latestMsgStatus
      }),
    )
  },
  clearConvoItemLatestMsg(roomId) {
    set(
      produce((state: ConvoStoreType) => {
        const idx = findRoomIndex(roomId, state.convo)
        if (idx === null) return null
        state.convo[idx].latestMsg = null
      }),
    )
  },
  searchConvoByUserId(userId) {
    const convo = get().convo
    let idx = convo.findIndex(item => item.user.id === userId)
    if (idx !== -1) return convo[idx].room

    const archivedConvo = get().archivedConvo
    idx = archivedConvo.findIndex(item => item.user.id === userId)
    if (idx !== -1) return archivedConvo[idx].room

    return null
  },
  addNewConvoItem(newItem) {
    set(
      produce((state: ConvoStoreType) => {
        pushAndSort(state.convo, newItem)
      }),
    )
  },
  archiveRoom(roomId) {
    set(
      produce((state: ConvoStoreType) => {
        const idx = findRoomIndex(roomId, state.convo)
        if (idx === null) return null
        const convoItem = state.convo.splice(idx, 1)[0] as unknown as ConvoItemType<true>
        convoItem.room.archived = true
        convoItem.room.pinned = false
        pushAndSort(state.archivedConvo, convoItem)
      }),
    )
  },
  unarchiveRoom(roomId) {
    set(
      produce((state: ConvoStoreType) => {
        const idx = findRoomIndex(roomId, state.archivedConvo)
        if (idx === null) return null
        const convoItem = state.archivedConvo.splice(idx, 1)[0] as unknown as ConvoItemType<false>
        convoItem.room.archived = false
        pushAndSort(state.convo, convoItem)
      }),
    )
  },
  deleteConvo(roomId, archived = false) {
    set(
      produce((state: ConvoStoreType) => {
        const list = archived ? state.archivedConvo : state.convo
        const idx = findRoomIndex(roomId, list)
        if (idx === null) return null
        list.splice(idx, 1)
      }),
    )
  },
  pinConvo(roomId) {
    set(
      produce((state: ConvoStoreType) => {
        const idx = findRoomIndex(roomId, state.convo)
        if (idx === null) return null
        const convoItem = state.convo.splice(idx, 1)[0]
        convoItem.room.pinned = true
        pushAndSort(state.convo, convoItem)
      }),
    )
  },
  unpinConvo(roomId) {
    set(
      produce((state: ConvoStoreType) => {
        const idx = findRoomIndex(roomId, state.convo)
        if (idx === null) return null
        const convoItem = state.convo.splice(idx, 1)[0]
        convoItem.room.pinned = false
        pushAndSort(state.convo, convoItem)
      }),
    )
  },
})

function findRoomIndex(roomId: number, list: ReadonlyArray<ConvoItemType<boolean>>): number | null {
  const idx = list.findIndex(val => val.room.id === roomId)
  if (idx === -1) {
    console.error('Room does not exist.')
    return null
  }
  return idx
}
function pushAndSort(list: ConvoItemType<boolean>[], item: Readonly<ConvoItemType<boolean>>): void {
  list.push(item)
  list.sort((a: Readonly<ConvoItemType<boolean>>, b: Readonly<ConvoItemType<boolean>>) => {
    // Pinned chats on top
    if (a.room.pinned && !b.room.pinned) return -1
    if (!a.room.pinned && b.room.pinned) return 1

    // Cleared convos at bottom
    if (a.latestMsg !== null && b.latestMsg === null) return -1
    if (a.latestMsg === null && b.latestMsg !== null) return 1
    if (a.latestMsg === null && b.latestMsg === null) return 0

    // Latest convo on top
    if (a.latestMsg!.createdAt > b.latestMsg!.createdAt) return -1
    if (a.latestMsg!.createdAt < b.latestMsg!.createdAt) return 1
    return 0
  })
}

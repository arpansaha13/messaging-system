import type { StateCreator } from 'zustand'
import produce from 'immer'

import type { ConvoItemType, MessageStatus } from '../types/index.types'

export interface ConvoStoreType {
  /** The currently active chat-room. */
  activeRoom: Pick<ConvoItemType<boolean>['room'], 'id' | 'archived'> | null
  /** Set new room - can be used to open/change to a new chat. */
  setActiveRoom: (room: ConvoStoreType['activeRoom'] | null) => void

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

  addNewConvoItemToTop: (newItem: ConvoItemType) => void

  clearConvoItemLatestMsg: (roomId: number) => void

  archivedConvo: ConvoItemType<true>[]

  /** Initialize the archived chat list. */
  initArchivedConvo: (initConvo: ConvoItemType<true>[]) => void

  archiveRoom: (roomId: number) => void
  unarchiveRoom: (roomId: number) => void
}

export const useConvoStore: StateCreator<ConvoStoreType, [], [], ConvoStoreType> = (set, get) => ({
  activeRoom: null,
  setActiveRoom(room) {
    set({ activeRoom: room })
  },
  convo: [],
  initUnarchivedConvo(initConvo) {
    set(() => ({ convo: initConvo }))
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
        state.convo.unshift(convoItem)
      }),
    )
  },
  updateConvoItemStatus(roomId, latestMsgStatus) {
    set(
      produce((state: ConvoStoreType) => {
        const idx = state.convo.findIndex(val => val.room.id === roomId)
        state.convo[idx].latestMsg!.status = latestMsgStatus
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
  addNewConvoItemToTop(newItem) {
    set(
      produce((state: ConvoStoreType) => {
        state.convo.unshift(newItem)
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
  archivedConvo: [],
  initArchivedConvo(initConvo) {
    set(() => ({ archivedConvo: initConvo }))
  },
  archiveRoom(roomId) {
    set(
      produce((state: ConvoStoreType) => {
        const idx = findRoomIndex(roomId, state.convo)
        if (idx === null) return null
        const convoItem = state.convo.splice(idx, 1)[0] as unknown as ConvoItemType<true>
        convoItem.room.archived = true

        // TODO: insert in sorted position
        state.archivedConvo.push(convoItem)
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

        // TODO: insert in sorted position
        state.convo.push(convoItem)
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

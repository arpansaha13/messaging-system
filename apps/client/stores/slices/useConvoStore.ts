import type { FetchHook, Slice } from '../types.store'
import type { ConvoItemType, MessageStatus } from '../../types'

type ActiveRoom = Pick<ConvoItemType<boolean>['room'], 'id' | 'archived'> | null

export interface ConvoStoreType {
  /** The currently active chat-room. */
  activeRoom: ActiveRoom
  /** Set new room - can be used to open/change to a new chat. */
  setActiveRoom: (room: ActiveRoom) => void
  getActiveRoom: () => ActiveRoom

  /** The list of unarchived chats with different users displayed on the sidebar. */
  convo: ConvoItemType[]
  archivedConvo: ConvoItemType<true>[]
  initConvo(fetchHook: FetchHook): Promise<void>

  isProxyConvo: boolean
  setProxyConvo: (proxyConvoState: boolean) => void

  updateConvoItem: (roomId: number, latestMsg: ConvoItemType['latestMsg'], fetchHook: FetchHook) => void

  updateConvoItemStatus: (roomId: number, latestMsgStatus: MessageStatus, senderId: number) => void

  /**
   * Search if a room exists with the given user.
   * @returns the room if the room exists, else `null`.
   */
  searchConvoByUserId: (userId: number) => ConvoItemType<boolean> | null

  addNewConvoItem: (newItem: ConvoItemType) => void

  clearConvoItemLatestMsg: (roomId: number) => void

  archiveRoom: (roomId: number, fetchHook: FetchHook) => void
  unarchiveRoom: (roomId: number, fetchHook: FetchHook) => void
  deleteConvo: (roomId: number, archived?: boolean) => void
  updateConvoPin: (roomId: number, pinned: boolean, fetchHook: FetchHook) => void
}

export const useConvoStore: Slice<ConvoStoreType> = (set, get) => ({
  activeRoom: null,
  setActiveRoom(room) {
    set({ activeRoom: room })
  },
  getActiveRoom() {
    return get().activeRoom
  },
  convo: [],
  archivedConvo: [],
  async initConvo(fetchHook) {
    const convoRes: any[] = await fetchHook('users/convo')
    const { unarchivedList, archivedList } = prepareConvo(convoRes)
    set(() => ({ convo: unarchivedList, archivedConvo: archivedList }))
  },
  isProxyConvo: false,
  setProxyConvo(proxyConvoState) {
    set(() => ({ isProxyConvo: proxyConvoState }))
  },
  updateConvoItem(roomId, latestMsg, fetchHook) {
    set((state: ConvoStoreType) => {
      let idx = findRoomIndex(roomId, state.archivedConvo)
      let convoItem: ConvoItemType<boolean> | null = null
      if (idx !== null) {
        convoItem = state.archivedConvo.splice(idx, 1)[0] as unknown as ConvoItemType<false>
        convoItem.room.archived = false
        convoItem.latestMsg = latestMsg
        pushAndSort(state.convo, convoItem)
        fetchHook(`user-to-room/unarchive/${roomId}`, { method: 'PATCH' })
        return
      }
      idx = findRoomIndex(roomId, state.convo)
      if (idx !== null) {
        convoItem = state.convo.splice(idx, 1)[0]
        convoItem.latestMsg = latestMsg
        pushAndSort(state.convo, convoItem)
      }
    })
  },
  updateConvoItemStatus(roomId, latestMsgStatus, senderId) {
    set((state: ConvoStoreType) => {
      let idx = findRoomIndex(roomId, state.convo)
      if (idx !== null) {
        const latestMsg = state.convo[idx].latestMsg!
        if (latestMsg.senderId === senderId) latestMsg.status = latestMsgStatus
        return
      }
      idx = findRoomIndex(roomId, state.archivedConvo)!
      state.archivedConvo[idx].latestMsg!.status = latestMsgStatus
    })
  },
  clearConvoItemLatestMsg(roomId) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(roomId, state.convo)
      if (idx === null) return null
      state.convo[idx].latestMsg = null
    })
  },
  searchConvoByUserId(userId) {
    const convo = get().convo
    let idx = convo.findIndex(item => item.user.id === userId)
    if (idx !== -1) return convo[idx]

    const archivedConvo = get().archivedConvo
    idx = archivedConvo.findIndex(item => item.user.id === userId)
    if (idx !== -1) return archivedConvo[idx]

    return null
  },
  addNewConvoItem(newItem) {
    set((state: ConvoStoreType) => {
      pushAndSort(state.convo, newItem)
    })
  },
  archiveRoom(roomId, fetchHook) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(roomId, state.convo)
      if (idx === null) return null
      const convoItem = state.convo.splice(idx, 1)[0] as unknown as ConvoItemType<true>
      convoItem.room.archived = true
      convoItem.room.pinned = false
      pushAndSort(state.archivedConvo, convoItem)
      fetchHook(`user-to-room/archive/${roomId}`, { method: 'PATCH' })
    })
  },
  unarchiveRoom(roomId, fetchHook) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(roomId, state.archivedConvo)
      if (idx === null) return null
      const convoItem = state.archivedConvo.splice(idx, 1)[0] as unknown as ConvoItemType<false>
      convoItem.room.archived = false
      pushAndSort(state.convo, convoItem)
      fetchHook(`user-to-room/unarchive/${roomId}`, { method: 'PATCH' })
    })
  },
  deleteConvo(roomId, archived = false) {
    set((state: ConvoStoreType) => {
      const list = archived ? state.archivedConvo : state.convo
      const idx = findRoomIndex(roomId, list)
      if (idx === null) return null
      list.splice(idx, 1)
    })
  },
  updateConvoPin(roomId, pinned, fetchHook) {
    set((state: ConvoStoreType) => {
      const idx = findRoomIndex(roomId, state.convo)
      if (idx === null) return null
      const convoItem = state.convo[idx]
      convoItem.room.pinned = pinned
      state.convo.sort(sortConvoCompareFn)
      if (pinned) fetchHook(`user-to-room/${roomId}/pin-chat`, { method: 'PATCH' })
      else fetchHook(`user-to-room/${roomId}/unpin-chat`, { method: 'PATCH' })
    })
  },
})

function findRoomIndex(roomId: number, list: ReadonlyArray<ConvoItemType<boolean>>): number | null {
  const idx = list.findIndex(val => val.room.id === roomId)
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
  if (a.room.pinned && !b.room.pinned) return -1
  if (!a.room.pinned && b.room.pinned) return 1

  // Cleared convo's at bottom
  if (a.latestMsg !== null && b.latestMsg === null) return -1
  if (a.latestMsg === null && b.latestMsg !== null) return 1
  if (a.latestMsg === null && b.latestMsg === null) return 0

  // Latest convo on top
  if (a.latestMsg!.createdAt > b.latestMsg!.createdAt) return -1
  if (a.latestMsg!.createdAt < b.latestMsg!.createdAt) return 1
  return 0
}
/** Generic type A = archived */
function prepareConvo(convoRes: any[]): {
  unarchivedList: ConvoItemType[]
  archivedList: ConvoItemType<true>[]
} {
  const archivedList: ConvoItemType<true>[] = []
  const unarchivedList: ConvoItemType[] = []

  for (const convoItem of convoRes) {
    const template: ConvoItemType<boolean> = {
      userToRoomId: convoItem.u2r_id,
      room: {
        id: convoItem.r_id,
        archived: convoItem.u2r_archived,
        pinned: convoItem.u2r_pinned,
        muted: convoItem.u2r_muted,
        isGroup: convoItem.r_is_group,
      },
      contact: convoItem.c_id
        ? {
            id: convoItem.c_id,
            alias: convoItem.c_alias,
          }
        : null,
      user: {
        id: convoItem.u_id,
        dp: convoItem.u_dp,
        bio: convoItem.u_bio,
        displayName: convoItem.u_display_name,
      },
      latestMsg: convoItem.msg_content
        ? {
            content: convoItem.msg_content,
            createdAt: convoItem.msg_created_at,
            senderId: convoItem.msg_sender_id,
            status: convoItem.msg_status,
          }
        : null,
    }
    if (template.room.archived) archivedList.push(template as ConvoItemType<true>)
    else unarchivedList.push(template as ConvoItemType<false>)
  }
  return { unarchivedList, archivedList }
}

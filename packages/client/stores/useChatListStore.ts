import type { StateCreator } from 'zustand'
import produce from 'immer'

import type { ChatListItemType, MessageStatus } from '../types/index.types'

export interface ChatListStoreType {
  /** The currently active chat-room. */
  activeRoom: Pick<ChatListItemType<boolean>['room'], 'id' | 'archived'> | null
  /** Set new room - can be used to open/change to a new chat. */
  setActiveRoom: (room: ChatListStoreType['activeRoom'] | null) => void

  /** The list of chats with different users displayed on the sidebar. */
  chatList: ChatListItemType[]

  /** Initialize the unarchived chat list. */
  initUnarchivedStore: (initChatList: ChatListItemType[]) => void

  isProxyRoom: boolean
  setProxyRoom: (proxyRoomState: boolean) => void

  updateChatListItem: (roomId: number, latestMsg: ChatListItemType['latestMsg']) => void

  updateChatListItemStatus: (roomId: number, latestMsgStatus: MessageStatus) => void

  /**
   * Search if a room exists wth the given user.
   * @returns the room_id if the room exists, else `null`.
   */
  searchRoomByUserId: (userId: number) => ChatListItemType<boolean>['room'] | null

  addNewChatListItemToTop: (newItem: ChatListItemType) => void

  clearChatListItemLatestMsg: (roomId: number) => void

  /** Archived chat list. */
  archivedChatList: ChatListItemType<true>[]

  /** Initialize the archived chat list. */
  initArchivedStore: (initChatList: ChatListItemType<true>[]) => void

  archiveRoom: (roomId: number) => void
  unarchiveRoom: (roomId: number) => void
}

export const useChatListStore: StateCreator<ChatListStoreType, [], [], ChatListStoreType> = (set, get) => ({
  activeRoom: null,
  setActiveRoom(room) {
    set({ activeRoom: room })
  },
  chatList: [],
  initUnarchivedStore(initChatList) {
    set(() => ({ chatList: initChatList }))
  },
  isProxyRoom: false,
  setProxyRoom(proxyRoomState) {
    set(() => ({ isProxyRoom: proxyRoomState }))
  },
  updateChatListItem(roomId, latestMsg) {
    set(
      produce((state: ChatListStoreType) => {
        const idx = findRoomIndex(roomId, state.chatList)
        if (idx === null) return null
        const chatListItem = state.chatList.splice(idx, 1)[0]
        chatListItem.latestMsg = latestMsg
        state.chatList.unshift(chatListItem)
      }),
    )
  },
  updateChatListItemStatus(roomId, latestMsgStatus) {
    set(
      produce((state: ChatListStoreType) => {
        const idx = state.chatList.findIndex(val => val.room.id === roomId)
        state.chatList[idx].latestMsg!.status = latestMsgStatus
      }),
    )
  },
  searchRoomByUserId(userId) {
    const chatList = get().chatList
    let idx = chatList.findIndex(item => item.user.id === userId)
    if (idx !== -1) return chatList[idx].room

    const archivedChatList = get().archivedChatList
    idx = archivedChatList.findIndex(item => item.user.id === userId)
    if (idx !== -1) return archivedChatList[idx].room

    return null
  },
  addNewChatListItemToTop(newItem) {
    set(
      produce((state: ChatListStoreType) => {
        state.chatList.unshift(newItem)
      }),
    )
  },
  clearChatListItemLatestMsg(roomId) {
    set(
      produce((state: ChatListStoreType) => {
        const idx = findRoomIndex(roomId, state.chatList)
        if (idx === null) return null
        state.chatList[idx].latestMsg = null
      }),
    )
  },
  archivedChatList: [],
  initArchivedStore(initChatList) {
    set(() => ({ archivedChatList: initChatList }))
  },
  archiveRoom(roomId) {
    set(
      produce((state: ChatListStoreType) => {
        const idx = findRoomIndex(roomId, state.chatList)
        if (idx === null) return null
        const chatListItem = state.chatList.splice(idx, 1)[0] as unknown as ChatListItemType<true>
        chatListItem.room.archived = true

        // TODO: insert in sorted position
        state.archivedChatList.push(chatListItem)
      }),
    )
  },
  unarchiveRoom(roomId) {
    set(
      produce((state: ChatListStoreType) => {
        const idx = findRoomIndex(roomId, state.archivedChatList)
        if (idx === null) return null
        const chatListItem = state.archivedChatList.splice(idx, 1)[0] as unknown as ChatListItemType<false>
        chatListItem.room.archived = false

        // TODO: insert in sorted position
        state.chatList.push(chatListItem)
      }),
    )
  },
})

function findRoomIndex(roomId: number, list: ReadonlyArray<ChatListItemType<boolean>>): number | null {
  const idx = list.findIndex(val => val.room.id === roomId)
  if (idx === -1) {
    console.error('Room does not exist.')
    return null
  }
  return idx
}

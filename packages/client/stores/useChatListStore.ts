import type { StateCreator } from 'zustand'
import produce from 'immer'

import type { ChatListItemType, MessageStatus } from '../types/index.types'

export interface ChatListStoreType {
  /** The currently active chat-room. */
  activeRoomId: number | null
  /** Set new room - can be used to open/change to a new chat. */
  setActiveRoomId: (roomId: number | null) => void

  /** The list of chats with different users displayed on the sidebar. */
  chatList: ChatListItemType[]
  /** Initialize the chat list. */
  initChatListStore: (initChatList: ChatListItemType[]) => void

  isProxyRoom: boolean
  setProxyRoom: (proxyRoomState: boolean) => void

  updateChatListItem: (roomId: number, latestMsg: ChatListItemType['latestMsg']) => void

  updateChatListItemStatus: (roomId: number, latestMsgStatus: MessageStatus) => void

  /**
   * Search if a room exists wth the given user.
   * @returns the room_id if the room exists, else `null`.
   */
  searchRoomIdByUserId: (userId: number) => number | null

  addNewChatListItemToTop: (newItem: ChatListItemType) => void

  clearChatListItemLatestMsg: (roomId: number) => void
}

export const useChatListStore: StateCreator<ChatListStoreType, [], [], ChatListStoreType> = (set, get) => ({
  activeRoomId: null,
  setActiveRoomId(roomId) {
    set(() => ({ activeRoomId: roomId }))
  },
  chatList: [],
  initChatListStore(initChatList) {
    set(() => ({ chatList: initChatList }))
  },
  isProxyRoom: false,
  setProxyRoom(proxyRoomState) {
    set(() => ({ isProxyRoom: proxyRoomState }))
  },
  updateChatListItem(roomId, latestMsg) {
    set(
      produce((state: ChatListStoreType) => {
        const idx = state.chatList.findIndex(val => val.room.id === roomId)
        if (idx === -1) return
        let chatListItem = state.chatList.splice(idx, 1)[0]
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
  searchRoomIdByUserId(userId) {
    const chatList = get().chatList
    const idx = chatList.findIndex(item => item.user.id === userId)
    if (idx === -1) return null
    return chatList[idx].room.id
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
        const idx = state.chatList.findIndex(val => val.room.id === roomId)
        if (idx === -1) return
        state.chatList[idx].latestMsg = null
      }),
    )
  },
})

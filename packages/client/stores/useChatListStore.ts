import create from 'zustand'
import produce from 'immer'

import type { ChatListItemType } from '../types'

interface ChatListStoreType {
  /** The currently active chat. Every chat is identified with the user_id (primary key). */
  activeChatUserId: number | null

  /** The list of chats with different users displayed on the sidebar. */
  chatList: ChatListItemType[]

  /** Initialize the chat list. */
  init: (initChatList: ChatListItemType[]) => void

  updateChatListItem: (userId: number, partialChatListItem: Partial<ChatListItemType>) => void

  /** Open a chat with a user. */
  setActiveChatUserId: (userId: number) => void
}

export const useChatListStore = create<ChatListStoreType>()(set => ({
  activeChatUserId: null,
  chatList: [],
  init(initChatList: ChatListItemType[]) {
    set(() => {
      const newChatList: ChatListItemType[] = []

      for (const chatListItem of initChatList) {
        newChatList.push(chatListItem)
      }

      return { chatList: newChatList }
    })
  },
  updateChatListItem(userId, partialChatListItem) {
    set(
      produce((state: ChatListStoreType) => {
        const idx = state.chatList.findIndex(val => val.userId === userId)
        if (idx === -1) return
        let chatListItem = state.chatList.splice(idx, 1)[0]
        chatListItem = { ...chatListItem, ...partialChatListItem }
        state.chatList.unshift(chatListItem)
      }),
    )
  },
  setActiveChatUserId(userId: number) {
    set(() => ({ activeChatUserId: userId }))
  },
}))

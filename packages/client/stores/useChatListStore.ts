import create from 'zustand'

import type { ChatListItemType } from '../types'

interface ChatListStoreType {
  /** The currently active chat. Every chat is identified with the user_id (primary key). */
  activeChat: number | null

  /** The list of chats with different users displayed on the sidebar. */
  chatList: ChatListItemType[]

  /** Initialize the chat list. */
  init: (initChatList: ChatListItemType[]) => void

  /** Open a chat with a user. */
  setActiveChat: (user_id: number) => void
}

export const useChatListStore = create<ChatListStoreType>()(set => ({
  activeChat: null,
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
  setActiveChat(user_id: number) {
    set(() => ({ activeChat: user_id }))
  },
}))

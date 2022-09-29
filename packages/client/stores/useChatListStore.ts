import create from 'zustand'
import { devtools } from 'zustand/middleware'

import type { ChatListItemType } from '../types'

interface ChatListStoreType {
  /** The currently active chat. Every chat is identified with the userTag (primary key). */
  activeChat: string | null

  /** The list of chats with different users displayed on the sidebar. */
  chatList: ChatListItemType[]

  /** Initialize the chat list. */
  init: (initChatList: ChatListItemType[]) => void

  /** Open a chat with a user. */
  setActiveChat: (userTag: string) => void
}

export const useChatListStore = create<ChatListStoreType>()(
  devtools(
    (set) => ({
      activeChat: null,
      chatList: [],
      init(initChatList: ChatListItemType[]) {
        set(() => {
          const newChatList: ChatListItemType[] = []

          for (const chatListItem of initChatList) {
            newChatList.push(chatListItem)
          }

          return {chatList: newChatList}
        })
      },
      setActiveChat(userTag: string) {
        set(() => ({ activeChat: userTag }))
      }
    }),
  )
)
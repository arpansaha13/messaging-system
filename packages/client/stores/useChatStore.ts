import create from 'zustand'
import produce from 'immer'

import type { MessageType } from '../types'

interface ChatStoreType {
  /** List of all chats of the logged-in user, mapped with their respective userTags. */
  chats: Map<string, MessageType[]>

  /** Add a new chat. This is meant to be used when a new chat is opened for the first time. */
  add: (userTag: string, chat: MessageType[]) => void

  /** Append new messages to existing chat. This is meant to be used when an existing chat is re-opened with new unread messages. */
  push: (userTag: string, messages: MessageType[]) => void

  /** Append a newly sent message. This can be used during an ongoing chat.  */
  send: (userTag: string, msgString: string) => void
}

export const useChatStore = create<ChatStoreType>()(
  (set, get) => ({
    chats: new Map<string, MessageType[]>(),
    add(userTag: string, chat: MessageType[]) {
      set(state => ({ chats: state.chats.set(userTag, chat) }))
    },
    push(userTag: string, messages: MessageType[]) {
      // Use `Immer` for nested updates
      set(
        produce(state => {
          const chat = state.chats.get(userTag)!
          chat.push(...messages)
          state.chats.set(userTag, chat)
        })
      )
    },
    send(userTag: string, msg: string) {
      get().push(userTag, [
        {
          msg,
          myMsg: true,
          status: 'sent',
          time: '4:60 PM',
        }
      ])
    }
  }),
)

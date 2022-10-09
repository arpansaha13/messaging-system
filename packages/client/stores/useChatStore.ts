import create from 'zustand'
import produce from 'immer'

import type { MessageType } from '../types'

interface ChatStoreType {
  /** List of all chats of the logged-in user, mapped with their respective userTags. */
  chats: Map<number, MessageType[]>

  /** Add a new chat. This is meant to be used when a new chat is opened for the first time. */
  add: (user_id: number, chat: MessageType[]) => void

  /** Append new messages to existing chat. This is meant to be used when an existing chat is re-opened with new unread messages. */
  push: (user_id: number, messages: MessageType[]) => void

  /** Append a newly sent message. This can be used during an ongoing chat.  */
  send: (user_id: number, msg: string) => void
}

export const useChatStore = create<ChatStoreType>()((set, get) => ({
  chats: new Map<number, MessageType[]>(),
  add(user_id: number, chat: MessageType[]) {
    // Update through `Immer`
    set(
      produce(state => {
        state.chats.set(user_id, chat)
      }),
    )
  },
  push(user_id: number, messages: MessageType[]) {
    // Use `Immer` for nested updates
    set(
      produce(state => {
        const chat = state.chats.get(user_id)!
        chat.push(...messages)
        state.chats.set(user_id, chat)
      }),
    )
  },
  send(user_id: number, msg: string) {
    get().push(user_id, [
      {
        msg,
        myMsg: true,
        status: 'sent',
        time: Date.now(),
      },
    ])
  },
}))

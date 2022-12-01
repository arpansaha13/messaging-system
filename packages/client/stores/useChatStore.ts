import create from 'zustand'
import produce from 'immer'
// Types
import type { ContactType, MessageType, MsgConfirmedType } from '../types'

// TODO: Try to use some other usique identifier for each message instead of time. What if both sender and receiver create a msg at same time?

interface ChatStoreType {
  /**
   * List of all chats of the logged-in user, mapped with their respective user_id.
   * Each message in a chat is again mapped with their timestamps.
   */
  chats: Map<number, Map<number, MessageType>>

  /** The details of the user whose chat is opened. */
  activeChatUser: ContactType | null

  /** Add a new chat. This is meant to be used when a new chat is opened for the first time.
   * @param userId All chats are mapped with the user_id with whom the chat is.
   * @param chat The new chat and messages to be added.
   */
  add: (userId: number, chat: MessageType[]) => void

  /** Append new messages to existing chat. This is meant to be used when an existing chat is re-opened with new unread messages.
   * @param userId All chats are mapped with the user_id with whom the chat is.
   * @param messages New messages to be appended.
   */
  push: (userId: number, messages: MessageType[]) => void

  /** Append a newly sent message. This can be used during an ongoing chat.
   * @param userId All chats are mapped with the user_id with whom the chat is.
   * @param msg Message to be sent.
   */
  send: (userId: number, msg: string, time: number) => void

  /** Append the received messages to ongoing chat.
   * @param userId All chats are mapped with the user_id with whom the chat is.
   * @param msg Message to be received.
   */
  receive: (userId: number, msg: string, time: number) => void

  updateStatus: (
    userId: number,
    time: number,
    newStatus: MsgConfirmedType['status'],
  ) => void

  /** Update the active chat-user when a new chat is opened. */
  setActiveChatUser: (contact: ContactType) => void
}

export const useChatStore = create<ChatStoreType>()((set, get) => ({
  chats: new Map<number, Map<number, MessageType>>(),
  activeChatUser: null,
  add(userId: number, chat: MessageType[]) {
    // Update through `Immer`
    set(
      produce(state => {
        const newChat = new Map<number, MessageType>()
        for (const message of chat) {
          newChat.set(message.time, message)
        }
        state.chats.set(userId, newChat)
      }),
    )
  },
  push(userId: number, messages: MessageType[]) {
    // Use `Immer` for nested updates
    set(
      produce((state: ChatStoreType) => {
        let chat = state.chats.get(userId)

        // If this is a new chat, then it would not exist in the `chats` map. Add it first.
        if (typeof chat === 'undefined') {
          get().add(userId, [])
          chat = get().chats.get(userId)!
        }
        for (const message of messages) {
          chat.set(message.time, message)
        }
        state.chats.set(userId, chat)
      }),
    )
  },
  send(userId: number, msg: string, time: number) {
    get().push(userId, [
      {
        msg,
        time,
        myMsg: true,
        status: 'sending',
      },
    ])
  },
  receive(userId: number, msg: string, time: number) {
    get().push(userId, [
      {
        msg,
        time,
        myMsg: false,
      },
    ])
  },
  updateStatus(
    userId: number,
    time: number,
    newStatus: MsgConfirmedType['status'],
  ) {
    // Update through `Immer`
    set(
      produce((state: ChatStoreType) => {
        const chat = state.chats.get(userId)!
        const msgToUpdate = chat.get(time)! as MsgConfirmedType
        const updatedMsg = { ...msgToUpdate, status: newStatus }
        chat.set(time, updatedMsg)
      }),
    )
  },
  setActiveChatUser(contact: ContactType) {
    set({ activeChatUser: contact })
  },
}))

import create from 'zustand'
import produce from 'immer'
// Utils
import { ISOToMilliSecs } from '../utils/ISODate'
// Enum
import { MessageStatus } from '../types/index.types'
// Types
import type { MessageType, ChatListItemType } from '../types/index.types'

// TODO: Try to use some other unique identifier for each message instead of time. What if both sender and receiver create a msg at same time?
// TODO: Refactor senderId and receiverId variable names properly

type ActiveChatInfo = null | Omit<ChatListItemType, 'latestMsg' | 'room' | 'userToRoomId'>

interface ChatStoreType {
  /**
   * List of all chats of the logged-in user, mapped with their respective room_id.
   * Each message in a chat is again mapped with their timestamps (for now).
   */
  chats: Map<number, Map<number, MessageType>>

  activeChatInfo: ActiveChatInfo | null

  /** Add a new chat. */
  add: (roomId: number, chat: MessageType[]) => void

  /** Append new messages to existing chat. This is meant to be used when an existing chat is re-opened with new unread messages. */
  push: (roomId: number, messages: MessageType[]) => void

  /** Append a newly sent message. This can be used during an ongoing chat. */
  send: (roomId: number, senderId: number, content: string, ISOtime: string) => void

  /** Append the received messages to ongoing chat. */
  receive: (roomId: number, content: string, senderId: number, ISOtime: string) => void

  updateStatus: (roomId: number, ISOtime: string, newStatus: Exclude<MessageStatus, MessageStatus.SENDING>) => void

  /** Update the active chat-user when a new chat is opened. */
  setActiveChatInfo: (newChatInfo: ActiveChatInfo) => void

  /* `activeChatInfo` will be null in functon scope because of closure. Access it through a function to get updated state. */
  getActiveChatInfo: () => ActiveChatInfo

  clearChat: (roomId: number) => void
}

export const useChatStore = create<ChatStoreType>()((set, get) => ({
  chats: new Map<number, Map<number, MessageType>>(),
  activeChatInfo: null,
  add(roomId: number, chat: MessageType[]) {
    // Update through `Immer`
    set(
      produce((state: ChatStoreType) => {
        const newChat = new Map<number, MessageType>()
        for (const message of chat) {
          newChat.set(ISOToMilliSecs(message.createdAt), message)
        }
        state.chats.set(roomId, newChat)
      }),
    )
  },
  push(roomId: number, messages: MessageType[]) {
    // Use `Immer` for nested updates
    set(
      produce((state: ChatStoreType) => {
        let chat = state.chats.get(roomId)

        // If this is a new chat, then it would not exist in the `chats` map. Add it first.
        if (typeof chat === 'undefined') {
          get().add(roomId, [])
          chat = get().chats.get(roomId)!
        }
        for (const message of messages) {
          chat.set(ISOToMilliSecs(message.createdAt), message)
        }
        state.chats.set(roomId, chat)
      }),
    )
  },
  send(roomId: number, senderId: number, content: string, ISOtime: string) {
    get().push(roomId, [
      {
        content,
        senderId,
        createdAt: ISOtime,
        status: MessageStatus.SENDING,
      },
    ])
  },
  receive(roomId, content, senderId, ISOtime) {
    get().push(roomId, [
      {
        content,
        senderId,
        createdAt: ISOtime,
        status: null,
      },
    ])
  },
  updateStatus(roomId: number, ISOtime: string, newStatus: Exclude<MessageStatus, MessageStatus.SENDING>) {
    // Update through `Immer`
    set(
      produce((state: ChatStoreType) => {
        const timeMilliSecs = ISOToMilliSecs(ISOtime)
        const chat = state.chats.get(roomId)!
        const msgToUpdate = chat.get(timeMilliSecs)!
        const updatedMsg = { ...msgToUpdate, status: newStatus }
        chat.set(timeMilliSecs, updatedMsg)
      }),
    )
  },
  setActiveChatInfo(newChatInfo) {
    set({ activeChatInfo: newChatInfo })
  },
  getActiveChatInfo() {
    return get().activeChatInfo
  },
  clearChat(roomId: number) {
    set(
      produce((state: ChatStoreType) => {
        state.chats.set(roomId, new Map<number, MessageType>())
      }),
    )
  },
}))

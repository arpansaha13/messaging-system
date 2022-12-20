import type { StateCreator } from 'zustand'
import produce from 'immer'
// Utils
import { ISOToMilliSecs } from '../utils/ISODate'
// Enum
import { MessageStatus } from '../types/index.types'
// Types
import type { MessageType, ConvoItemType } from '../types/index.types'

// TODO: Try to use some other unique identifier for each message instead of time. What if both sender and receiver create a msg at same time?

type ActiveChatInfo = Omit<ConvoItemType, 'latestMsg' | 'room' | 'userToRoomId'> | null

export interface ChatStoreType {
  /**
   * List of all chats of the logged-in user, mapped with their respective room_id.
   * Each message in a chat is again mapped with their timestamps (for now).
   */
  chats: Map<number, Map<number, MessageType>>
  getChats: () => ChatStoreType['chats']

  activeChatInfo: ActiveChatInfo
  getActiveChatInfo: () => ActiveChatInfo
  setActiveChatInfo: (newChatInfo: ActiveChatInfo) => void

  /** Add a new chat. */
  addChat: (roomId: number, chat: MessageType[]) => void

  /** Append new messages to existing chat. This is meant to be used when an existing chat is re-opened with new unread messages. */
  pushChat: (roomId: number, messages: MessageType[]) => void

  /** Append a newly sent message. This can be used during an ongoing chat. */
  sendMsg: (roomId: number, senderId: number, content: string, ISOtime: string) => void

  /** Append the received messages to ongoing chat. */
  receiveMsg: (roomId: number, content: string, senderId: number, ISOtime: string) => void

  updateMsgStatus: (roomId: number, ISOtime: string, newStatus: Exclude<MessageStatus, MessageStatus.SENDING>) => void
  updateAllMsgStatus: (
    roomId: number,
    newStatus: Exclude<MessageStatus, MessageStatus.SENDING | MessageStatus.SENT>,
  ) => void

  clearChat: (roomId: number) => void
  deleteChat: (roomId: number) => void
}

export const useChatStore: StateCreator<ChatStoreType, [], [], ChatStoreType> = (set, get) => ({
  chats: new Map<number, Map<number, MessageType>>(),
  getChats() {
    return get().chats
  },
  activeChatInfo: null,
  setActiveChatInfo(newChatInfo) {
    set({ activeChatInfo: newChatInfo })
  },
  getActiveChatInfo() {
    return get().activeChatInfo
  },
  addChat(roomId: number, chat: MessageType[]) {
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
  pushChat(roomId: number, messages: MessageType[]) {
    // Use `Immer` for nested updates
    set(
      produce((state: ChatStoreType) => {
        let chat = state.chats.get(roomId)

        // If this is a new chat, then it would not exist in the `chats` map. Add it first.
        if (typeof chat === 'undefined') {
          get().addChat(roomId, [])
          chat = get().chats.get(roomId)!
        }
        for (const message of messages) {
          chat.set(ISOToMilliSecs(message.createdAt), message)
        }
        state.chats.set(roomId, chat)
      }),
    )
  },
  sendMsg(roomId: number, senderId: number, content: string, ISOtime: string) {
    get().pushChat(roomId, [
      {
        content,
        senderId,
        createdAt: ISOtime,
        status: MessageStatus.SENDING,
      },
    ])
  },
  receiveMsg(roomId, content, senderId, ISOtime) {
    get().pushChat(roomId, [
      {
        content,
        senderId,
        createdAt: ISOtime,
        status: null,
      },
    ])
  },
  updateMsgStatus(roomId, ISOtime, newStatus) {
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
  updateAllMsgStatus(roomId, newStatus) {
    set(
      produce((state: ChatStoreType) => {
        const chat = state.chats.get(roomId)
        if (!chat) {
          console.error('Chat not found. Invalid `roomId`')
          return
        }
        const iter = chat.values()
        let iterRes = iter.next()
        while (!iterRes.done) {
          iterRes.value.status = newStatus
          iterRes = iter.next()
        }
      }),
    )
  },
  clearChat(roomId: number) {
    set(
      produce((state: ChatStoreType) => {
        state.chats.set(roomId, new Map<number, MessageType>())
      }),
    )
  },
  deleteChat(roomId: number) {
    set(
      produce((state: ChatStoreType) => {
        state.chats.delete(roomId)
      }),
    )
  },
})

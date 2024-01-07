import { ISOToMilliSecs } from '~/utils'
import { MessageStatus } from '~/types'
import type { FetchHook, Slice } from '~/stores/types.store'
import type { MessageType, ConvoItemType, MsgReceivedType } from '~/types'

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
  sendMsg: (roomId: number, msg: Omit<MsgReceivedType, 'status'>) => void

  /** Append the received messages to ongoing chat. */
  receiveMsg: (roomId: number, msg: Omit<MsgReceivedType, 'status'>) => void

  updateMsgStatus: (roomId: number, ISOtime: string, newStatus: Exclude<MessageStatus, MessageStatus.SENDING>) => void
  updateAllMsgStatus: (
    roomId: number,
    newStatus: Exclude<MessageStatus, MessageStatus.SENDING | MessageStatus.SENT>,
    senderId: number,
  ) => void

  clearChat: (roomId: number, fetchHook: FetchHook) => void
  deleteChat: (roomId: number, fetchHook: FetchHook) => void
}

export const useChatStore: Slice<ChatStoreType> = (set, get) => ({
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
    set((state: ChatStoreType) => {
      const newChat = new Map<number, MessageType>()
      for (const message of chat) {
        newChat.set(ISOToMilliSecs(message.createdAt), message)
      }
      state.chats.set(roomId, newChat)
    })
  },
  pushChat(roomId: number, messages: MessageType[]) {
    // Use `Immer` for nested updates
    set((state: ChatStoreType) => {
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
    })
  },
  sendMsg(roomId, msg) {
    get().pushChat(roomId, [
      {
        ...msg,
        status: MessageStatus.SENDING,
      },
    ])
  },
  receiveMsg(roomId, msg) {
    get().pushChat(roomId, [
      {
        ...msg,
        status: MessageStatus.DELIVERED,
      },
    ])
  },
  updateMsgStatus(roomId, ISOtime, newStatus) {
    set((state: ChatStoreType) => {
      const timeMilliSecs = ISOToMilliSecs(ISOtime)
      const chat = state.chats.get(roomId)!
      const msgToUpdate = chat.get(timeMilliSecs)!
      const updatedMsg = { ...msgToUpdate, status: newStatus }
      chat.set(timeMilliSecs, updatedMsg)
    })
  },
  updateAllMsgStatus(roomId, newStatus, senderId) {
    set((state: ChatStoreType) => {
      const chat = state.chats.get(roomId)
      if (!chat) {
        console.error('Chat not found. Invalid `roomId`')
        return
      }
      const iter = chat.values()
      let iterRes = iter.next()
      while (!iterRes.done) {
        if (iterRes.value.senderId === senderId) iterRes.value.status = newStatus
        iterRes = iter.next()
      }
    })
  },
  clearChat(roomId, fetchHook) {
    set((state: ChatStoreType) => {
      fetchHook(`user-to-room/${roomId}/clear-chat`, { method: 'DELETE' })
      state.chats.set(roomId, new Map<number, MessageType>())
    })
  },
  deleteChat(roomId, fetchHook) {
    set((state: ChatStoreType) => {
      fetchHook(`user-to-room/${roomId}/delete-chat`, { method: 'DELETE' })
      state.chats.delete(roomId)
    })
  },
})

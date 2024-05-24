import _fetch from '~/utils/_fetch'
import { ISOToMilliSecs } from '~/utils'
import { MessageStatus } from '@pkg/types'
import type { Slice } from '~/store/types.store'
import type { MessageType, ConvoItemType, MsgReceivedType } from '@pkg/types'

// TODO: Try to use some other unique identifier for each message instead of time. What if both sender and receiver create a msg at same time?

type ActiveChat = Pick<ConvoItemType, 'receiver' | 'contact'> | null

export interface ChatStoreType {
  /**
   * List of all chats of the logged-in user, mapped with their respective room_id.
   * Each message in a chat is again mapped with their timestamps (for now).
   */
  chats: Map<number, Map<number, MessageType>>
  getChats: () => ChatStoreType['chats']

  activeChat: ActiveChat
  getActiveChat: () => ActiveChat
  setActiveChat: (newChatInfo: ActiveChat) => void

  isProxyChat: boolean
  setProxyChat: (bool: boolean) => void

  /** Add a new chat. */
  addChat: (receiverId: number, messages: MessageType[]) => void

  /** Append new messages to existing chat. This is meant to be used when an existing chat is re-opened with new unread messages. */
  pushChat: (receiverId: number, messages: MessageType[]) => void

  /** Append a newly sent message. This can be used during an ongoing chat. */
  sendMsg: (receiverId: number, msg: Omit<MsgReceivedType, 'status'>) => void

  /** Append the received messages to ongoing chat. */
  receiveMsg: (receiverId: number, msg: Omit<MsgReceivedType, 'status'>) => void

  updateMsgStatus: (
    receiverId: number,
    ISOtime: string,
    newStatus: Exclude<MessageStatus, MessageStatus.SENDING>,
  ) => void
  updateAllMsgStatus: (
    chatId: number,
    newStatus: Exclude<MessageStatus, MessageStatus.SENDING | MessageStatus.SENT>,
    senderId: number,
  ) => void

  clearChat: (chatId: number) => void
  deleteChat: (chatId: number) => void
}

export const useChatStore: Slice<ChatStoreType> = (set, get) => ({
  chats: new Map<number, Map<number, MessageType>>(),
  getChats() {
    return get().chats
  },
  activeChat: null,
  setActiveChat(activeChat) {
    set({ activeChat })
  },
  getActiveChat() {
    return get().activeChat
  },
  isProxyChat: false,
  setProxyChat(bool) {
    set(() => ({ isProxyConvo: bool }))
  },
  addChat(chatId: number, messages: MessageType[]) {
    // Update through `Immer`
    set((state: ChatStoreType) => {
      const newChat = new Map<number, MessageType>()
      for (const message of messages) {
        newChat.set(ISOToMilliSecs(message.createdAt), message)
      }
      state.chats.set(chatId, newChat)
    })
  },
  pushChat(chatId: number, messages: MessageType[]) {
    // Use `Immer` for nested updates
    set((state: ChatStoreType) => {
      let chat = state.chats.get(chatId)

      // If this is a new chat, then it would not exist in the `chats` map. Add it first.
      if (typeof chat === 'undefined') {
        get().addChat(chatId, [])
        chat = get().chats.get(chatId)!
      }
      for (const message of messages) {
        chat.set(ISOToMilliSecs(message.createdAt), message)
      }
      state.chats.set(chatId, chat)
    })
  },
  sendMsg(chatId, msg) {
    get().pushChat(chatId, [
      {
        ...msg,
        status: MessageStatus.SENDING,
      },
    ])
  },
  receiveMsg(chatId, msg) {
    get().pushChat(chatId, [
      {
        ...msg,
        status: MessageStatus.DELIVERED,
      },
    ])
  },
  updateMsgStatus(receiverId, ISOtime, newStatus) {
    set((state: ChatStoreType) => {
      const timeMilliSecs = ISOToMilliSecs(ISOtime)
      const chat = state.chats.get(receiverId)!
      const msgToUpdate = chat.get(timeMilliSecs)!
      const updatedMsg = { ...msgToUpdate, status: newStatus }
      chat.set(timeMilliSecs, updatedMsg)
    })
  },
  updateAllMsgStatus(chatId, newStatus, senderId) {
    set((state: ChatStoreType) => {
      const chat = state.chats.get(chatId)
      if (!chat) {
        console.error('Chat not found. Invalid `chatId`')
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
  clearChat(chatId) {
    set((state: ChatStoreType) => {
      _fetch(`chat/${chatId}/clear-chat`, { method: 'DELETE' })
      state.chats.set(chatId, new Map<number, MessageType>())
    })
  },
  deleteChat(chatId) {
    set((state: ChatStoreType) => {
      _fetch(`chat/${chatId}/delete-chat`, { method: 'DELETE' })
      state.chats.delete(chatId)
    })
  },
})

import _fetch from '~/utils/_fetch'
import { MessageStatus } from '@pkg/types'
import type { Slice } from '~/store/types.store'
import type { MessageType, ConvoItemType, MsgSendingType } from '@pkg/types'

export interface ChatStoreType {
  /**
   * List of all chats of the logged-in user, mapped with their respective receiverId.
   * Each message in a chat is again mapped with their messageId.
   */
  chats: Map<number, Map<number, MessageType>>
  getChats: () => ChatStoreType['chats']

  /** Messages that are newly created and are being sent. */
  tempChats: Map<number, Map<string, MsgSendingType>>

  activeChat: Pick<ConvoItemType<boolean>, 'receiver' | 'contact'> | null
  getActiveChat: () => ChatStoreType['activeChat']
  setActiveChat: (newChatInfo: ChatStoreType['activeChat']) => void

  upsertChat: (receiverId: number, messages: MessageType[]) => void
  upsertTempChat: (receiverId: number, messages: MsgSendingType[]) => void

  updateMsgStatus: (
    receiverId: number,
    messageId: number,
    newStatus: Exclude<MessageStatus, MessageStatus.SENDING>,
  ) => void

  clearChat: (receiverId: number) => void
  deleteChat: (receiverId: number) => void

  getTempMessage: (receiverId: number, hash: string) => MsgSendingType
  deleteTempMessage: (receiverId: number, hash: string) => void
}

export const useChatStore: Slice<ChatStoreType> = (set, get) => ({
  chats: new Map(),
  getChats() {
    return get().chats
  },

  tempChats: new Map(),
  getTempChats() {
    return get().tempChats
  },

  activeChat: null,
  setActiveChat(activeChat) {
    set({ activeChat })
  },
  getActiveChat() {
    return get().activeChat
  },

  upsertChat(receiverId, messages) {
    set(state => {
      let chat: Map<number, MessageType>

      if (!state.chats.has(receiverId)) {
        chat = new Map()
      } else {
        chat = state.chats.get(receiverId)!
      }

      for (const message of messages) {
        chat.set(message.id, message)
      }

      state.chats.set(receiverId, chat)
    })
  },

  upsertTempChat(receiverId, messages) {
    set(state => {
      let chat: Map<string, MsgSendingType>

      if (!state.tempChats.has(receiverId)) {
        chat = new Map()
      } else {
        chat = state.tempChats.get(receiverId)!
      }

      for (const message of messages) {
        chat.set(message.hash, message)
      }

      state.tempChats.set(receiverId, chat)
    })
  },

  updateMsgStatus(receiverId, messageId, newStatus) {
    set(state => {
      const chat = state.chats.get(receiverId)!
      const msgToUpdate = chat.get(messageId)!
      const updatedMsg = { ...msgToUpdate, status: newStatus }
      chat.set(messageId, updatedMsg)
    })
  },

  clearChat(receiverId) {
    set(state => {
      _fetch(`chats/${receiverId}/clear`, { method: 'DELETE' })
      state.chats.delete(receiverId)
      state.tempChats.delete(receiverId)
    })
  },

  deleteChat(receiverId) {
    set(state => {
      _fetch(`chats/${receiverId}/delete`, { method: 'DELETE' })
      state.chats.delete(receiverId)
      state.tempChats.delete(receiverId)
    })
  },

  getTempMessage(receiverId, hash) {
    const tempChat = get().tempChats.get(receiverId)!
    const message = tempChat.get(hash)!
    return message
  },

  deleteTempMessage(receiverId, hash) {
    set(state => {
      const tempChat = state.tempChats.get(receiverId)!
      tempChat.delete(hash)
    })
  },
})

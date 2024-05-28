import { isNullOrUndefined } from '@arpansaha13/utils'
import _fetch from '~/utils/_fetch'
import { MessageStatus } from '@pkg/types'
import type { Slice } from '~/store/types.store'
import type { MessageType, ChatListItemType, MsgSendingType } from '@pkg/types'

export interface ChatStoreType {
  /**
   * List of all chats of the logged-in user, mapped with their respective receiverId.
   * Each message in a chat is again mapped with their messageId.
   */
  chats: Map<number, Map<number, MessageType>>
  getChats: () => ChatStoreType['chats']

  /** Messages that are newly created and are being sent. */
  tempChats: Map<number, Map<string, MsgSendingType>>

  activeChat: Pick<ChatListItemType<boolean>, 'receiver' | 'contact'> | null
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
  deleteMessages: (receiverId: number) => void

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
      const chatExists = state.chats.has(receiverId)

      if (!chatExists) {
        chat = new Map()
      } else {
        chat = state.chats.get(receiverId)!
      }

      for (const message of messages) {
        chat.set(message.id, message)
      }

      if (!chatExists) state.chats.set(receiverId, chat)
    })
  },

  upsertTempChat(receiverId, messages) {
    set(state => {
      let tempChat: Map<string, MsgSendingType>
      const tempChatExists = state.tempChats.has(receiverId)

      if (!tempChatExists) {
        tempChat = new Map()
      } else {
        tempChat = state.tempChats.get(receiverId)!
      }

      for (const message of messages) {
        tempChat.set(message.hash, message)
      }

      if (!tempChatExists) state.tempChats.set(receiverId, tempChat)
    })
  },

  updateMsgStatus(receiverId, messageId, newStatus) {
    set(state => {
      const chat = state.chats.get(receiverId)!
      const message = chat.get(messageId)!
      // The chat may have been cleared. In that case message won't exist.
      if (!isNullOrUndefined(message)) message.status = newStatus
    })
  },

  clearChat(receiverId) {
    set(state => {
      _fetch(`chats/${receiverId}/clear`, { method: 'DELETE' })
      state.chats.delete(receiverId)
      state.tempChats.delete(receiverId)
    })
  },

  deleteMessages(receiverId) {
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

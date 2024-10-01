import { isNullOrUndefined } from '@arpansaha13/utils'
import type { IMessage, IMessageSending } from '@shared/types'
import type { Slice } from '~/store/types.store'
import type { MessageSliceType } from './types'
import { _clearMessages, _deleteMessages } from '~/utils/api'

export const messageSlice: Slice<MessageSliceType> = (set, get) => ({
  userMessagesMap: new Map(),

  getUserMessagesMap() {
    return get().userMessagesMap
  },

  tempMessagesMap: new Map(),

  getTempChats() {
    return get().tempMessagesMap
  },

  upsertMessages(receiverId, newMessages) {
    set(state => {
      let messages: Map<number, IMessage>
      const chatExists = state.userMessagesMap.has(receiverId)

      if (!chatExists) {
        messages = new Map()
      } else {
        messages = state.userMessagesMap.get(receiverId)!
      }

      for (const message of newMessages) {
        messages.set(message.id, message)
      }

      if (!chatExists) state.userMessagesMap.set(receiverId, messages)
    })
  },

  upsertTempMessages(receiverId, messages) {
    set(state => {
      let tempChat: Map<string, IMessageSending>
      const tempChatExists = state.tempMessagesMap.has(receiverId)

      if (!tempChatExists) {
        tempChat = new Map()
      } else {
        tempChat = state.tempMessagesMap.get(receiverId)!
      }

      for (const message of messages) {
        tempChat.set(message.hash, message)
      }

      if (!tempChatExists) state.tempMessagesMap.set(receiverId, tempChat)
    })
  },

  updateMessageStatus(receiverId, messageId, newStatus) {
    set(state => {
      const messages = state.userMessagesMap.get(receiverId)!
      const message = messages.get(messageId)!
      // The chat may have been cleared. In that case message won't exist.
      if (!isNullOrUndefined(message)) message.status = newStatus
    })
  },

  clearMessages(receiverId) {
    set(state => {
      _clearMessages(receiverId)

      // Map.clear() instead of Map.delete()
      // Deleting will cause another api call when this chat is opened
      state.userMessagesMap.get(receiverId)?.clear()

      state.tempMessagesMap.delete(receiverId)
    })
  },

  deleteMessages(receiverId) {
    set(state => {
      _deleteMessages(receiverId)
      state.userMessagesMap.delete(receiverId)
      state.tempMessagesMap.delete(receiverId)
    })
  },

  getTempMessage(receiverId, hash) {
    const tempChat = get().tempMessagesMap.get(receiverId)!
    const message = tempChat.get(hash)!
    return message
  },

  deleteTempMessage(receiverId, hash) {
    set(state => {
      const tempChat = state.tempMessagesMap.get(receiverId)!
      tempChat.delete(hash)
    })
  },
})

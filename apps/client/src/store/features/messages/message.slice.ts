import { PayloadAction } from '@reduxjs/toolkit'
import { createAppSlice } from '~/store/createAppSlice'
import { _clearMessages, _deleteMessages } from '~/utils/api'
import { _getMessages } from './messages.api'
import type { IUser } from '@shared/types/client'
import type { IMessage, IMessageSending, MessageStatus } from '@shared/types'

interface IMessageSlice {
  userMessagesMap: Map<IUser['id'], Map<IMessage['id'], IMessage>>

  /** Messages that are newly created and are being sent. */
  tempMessagesMap: Map<IUser['id'], Map<string, IMessageSending>>

  status: 'idle' | 'loading' | 'failed'
}

const initialState: IMessageSlice = {
  userMessagesMap: new Map(),
  tempMessagesMap: new Map(),
  status: 'idle',
}

export const messageSlice = createAppSlice({
  name: 'message',
  initialState,
  reducers: create => ({
    getMessages: create.asyncThunk(_getMessages, {
      pending: state => {
        state.status = 'loading'
      },
      fulfilled: (state, action) => {
        state.status = 'idle'
        const receiverId = action.meta.arg
        const newMessages = action.payload
        const messages = state.userMessagesMap.get(receiverId) ?? new Map<IUser['id'], IMessage>()
        newMessages.forEach(message => messages.set(message.id, message))
        state.userMessagesMap.set(receiverId, messages)
      },
      rejected: state => {
        state.status = 'failed'
      },
    }),
    upsertMessages: create.reducer(
      (state, action: PayloadAction<{ receiverId: IUser['id']; newMessages: IMessage[] }>) => {
        const { receiverId, newMessages } = action.payload
        const messages = state.userMessagesMap.get(receiverId) ?? new Map<IUser['id'], IMessage>()
        newMessages.forEach(message => messages.set(message.id, message))
        state.userMessagesMap.set(receiverId, messages)
      },
    ),
    upsertTempMessages: create.reducer(
      (state, action: PayloadAction<{ receiverId: IUser['id']; messages: IMessageSending[] }>) => {
        const { receiverId, messages } = action.payload
        const tempChat = state.tempMessagesMap.get(receiverId) ?? new Map<string, IMessageSending>()
        messages.forEach(message => tempChat.set(message.hash, message))
        state.tempMessagesMap.set(receiverId, tempChat)
      },
    ),
    updateMessageStatus: create.reducer(
      (
        state,
        action: PayloadAction<{
          receiverId: IUser['id']
          messageId: IMessage['id']
          newStatus: Exclude<MessageStatus, MessageStatus.SENDING>
        }>,
      ) => {
        const { receiverId, messageId, newStatus } = action.payload
        const messages = state.userMessagesMap.get(receiverId)
        const message = messages?.get(messageId)
        if (message) message.status = newStatus
      },
    ),
    clearMessages: create.reducer((state, action: PayloadAction<IUser['id']>) => {
      const receiverId = action.payload
      _clearMessages(receiverId)
      state.userMessagesMap.get(receiverId)?.clear()
      state.tempMessagesMap.delete(receiverId)
    }),
    deleteMessages: create.reducer((state, action: PayloadAction<IUser['id']>) => {
      const receiverId = action.payload
      _deleteMessages(receiverId)
      state.userMessagesMap.delete(receiverId)
      state.tempMessagesMap.delete(receiverId)
    }),
    deleteTempMessage: create.reducer((state, action: PayloadAction<{ receiverId: IUser['id']; hash: string }>) => {
      const { receiverId, hash } = action.payload
      const tempChat = state.tempMessagesMap.get(receiverId)
      tempChat?.delete(hash)
    }),
  }),
  selectors: {
    selectUserMessagesMap: slice => slice.userMessagesMap,
    selectTempMessagesMap: slice => slice.tempMessagesMap,
    selectMessages: (slice, userId: IUser['id']) => slice.userMessagesMap.get(userId),
    selectTempMessages: (slice, userId: IUser['id']) => slice.tempMessagesMap.get(userId),
  },
})

export const {
  getMessages,
  upsertMessages,
  upsertTempMessages,
  updateMessageStatus,
  clearMessages,
  deleteMessages,
  deleteTempMessage,
} = messageSlice.actions

export const { selectUserMessagesMap, selectTempMessagesMap, selectMessages, selectTempMessages } =
  messageSlice.selectors

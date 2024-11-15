import { PayloadAction } from '@reduxjs/toolkit'
import { MessageStatus } from '@shared/constants'
import { createAppSlice } from '~/store/createAppSlice'
import { _getMessages } from './messages.api'
import type { IChannel, IGroup } from '@shared/types/client'
import type { IGroupMessage, IGroupMessageSending } from '@shared/types'

interface IMessageSlice {
  groupMessagesMap: Map<IGroup['id'], Map<IGroupMessage['id'], IGroupMessage>>

  /** Messages that are newly created and are being sent. */
  tempGroupMessagesMap: Map<IGroup['id'], Map<string, IGroupMessageSending>>

  status: 'idle' | 'loading' | 'failed'
}

const initialState: IMessageSlice = {
  groupMessagesMap: new Map(),
  tempGroupMessagesMap: new Map(),
  status: 'idle',
}

export const messageGroupSlice = createAppSlice({
  name: 'group-message',
  initialState,

  reducers: create => ({
    getGroupMessages: create.reducer((state, action: PayloadAction<IChannel['id']>) => {
      const channelId = action.payload
      state.groupMessagesMap.set(channelId, new Map())
    }),
    upsertGroupMessages: create.reducer(
      (state, action: PayloadAction<{ channelId: IChannel['id']; newMessages: IGroupMessage[] }>) => {
        const { channelId, newMessages } = action.payload
        const messages = state.groupMessagesMap.get(channelId) ?? new Map<IGroupMessage['id'], IGroupMessage>()
        newMessages.forEach(message => messages.set(message.id, message))
        state.groupMessagesMap.set(channelId, messages)
      },
    ),
    upsertTempGroupMessages: create.reducer(
      (state, action: PayloadAction<{ channelId: IChannel['id']; messages: IGroupMessageSending[] }>) => {
        const { channelId, messages } = action.payload
        const tempChat = state.tempGroupMessagesMap.get(channelId) ?? new Map<string, IGroupMessageSending>()
        messages.forEach(message => tempChat.set(message.hash, message))
        state.tempGroupMessagesMap.set(channelId, tempChat)
      },
    ),
    deleteTempGroupMessage: create.reducer(
      (state, action: PayloadAction<{ channelId: IChannel['id']; hash: string }>) => {
        const { channelId, hash } = action.payload
        const tempChat = state.tempGroupMessagesMap.get(channelId)
        tempChat?.delete(hash)
      },
    ),
    updateGroupMessageStatus: create.reducer(
      (
        state,
        action: PayloadAction<{
          channelId: IChannel['id']
          messageId: IGroupMessage['id']
          newStatus: Exclude<MessageStatus, MessageStatus.SENDING>
        }>,
      ) => {
        const { channelId, messageId, newStatus } = action.payload
        const messages = state.groupMessagesMap.get(channelId)
        const message = messages?.get(messageId)
        if (message) message.status = newStatus
      },
    ),
  }),
  selectors: {
    selectGroupMessagesMap: slice => slice.groupMessagesMap,
    selectTempGroupMessagesMap: slice => slice.tempGroupMessagesMap,
    selectGroupMessages: (slice, channelId: IChannel['id']) => slice.groupMessagesMap.get(channelId),
    selectTempGroupMessages: (slice, channelId: IChannel['id']) => slice.tempGroupMessagesMap.get(channelId),
  },
})

export const {
  getGroupMessages,
  upsertGroupMessages,
  upsertTempGroupMessages,
  deleteTempGroupMessage,
  updateGroupMessageStatus,
} = messageGroupSlice.actions

export const { selectGroupMessagesMap, selectTempGroupMessagesMap, selectGroupMessages, selectTempGroupMessages } =
  messageGroupSlice.selectors

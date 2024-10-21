import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { _archiveChat, _getChats, _pinChat, _unarchiveChat, _unpinChat } from '~/utils/api'
import { MessageStatus } from '@shared/types'
import type { IChatListItem, IContact, IUser } from '@shared/types/client'

interface ChatListSliceType {
  unarchived: IChatListItem[]
  archived: IChatListItem[]
}

const initialState: ChatListSliceType = {
  unarchived: [],
  archived: [],
}

export const initChatList = createAsyncThunk('chats/initChatList', async (_, { dispatch }) => {
  const { unarchived, archived } = await _getChats()
  dispatch(setChats({ unarchived, archived }))
})

export const chatListSlice = createSlice({
  name: 'chatList',
  initialState,
  reducers: {
    updateChatListItemMessagePin: (state, action: PayloadAction<{ receiverId: number; pinned: boolean }>) => {
      const { receiverId, pinned } = action.payload
      const idx = findRoomIndex(receiverId, state.unarchived)
      if (idx === null) return
      const convo = state.unarchived[idx]
      convo.chat.pinned = pinned
      state.unarchived.sort(sortConvoCompareFn)
      if (pinned) _pinChat(receiverId)
      else _unpinChat(receiverId)
    },
    upsertChatListItemContact: (
      state,
      action: PayloadAction<{ receiverId: IUser['id']; newContact: Pick<IContact, 'id' | 'alias'> }>,
    ) => {
      const { receiverId, newContact } = action.payload
      let idx = findRoomIndex(receiverId, state.unarchived)
      let convo: IChatListItem

      if (idx === null) {
        idx = findRoomIndex(receiverId, state.archived)!
        if (idx === null) return
        convo = state.archived[idx]
      } else {
        convo = state.unarchived[idx]
      }

      if (isNullOrUndefined(convo.contact)) {
        convo.contact = { id: newContact.id, alias: newContact.alias }
      } else {
        convo.contact.alias = newContact.alias
      }
    },
    deleteChatListItemContact: (state, action: PayloadAction<number>) => {
      const receiverId = action.payload
      let idx = findRoomIndex(receiverId, state.unarchived)
      let convo: IChatListItem

      if (idx === null) {
        idx = findRoomIndex(receiverId, state.archived)!
        if (idx === null) return
        convo = state.archived[idx]
      } else {
        convo = state.unarchived[idx]
      }

      if (isNullOrUndefined(convo.contact)) return

      convo.contact = null
    },
    clearChatListItemMessage: (state, action: PayloadAction<number>) => {
      const receiverId = action.payload
      let idx = findRoomIndex(receiverId, state.unarchived)
      if (idx !== null) state.unarchived[idx].latestMsg = null

      idx = findRoomIndex(receiverId, state.archived)
      if (idx !== null) state.archived[idx].latestMsg = null
    },
    setChats: (state, action: PayloadAction<{ unarchived: IChatListItem[]; archived: IChatListItem[] }>) => {
      state.unarchived = action.payload.unarchived
      state.archived = action.payload.archived
    },
    insertUnarchivedChat: (state, action: PayloadAction<IChatListItem>) => {
      state.unarchived.push(action.payload)
      state.unarchived.sort(sortConvoCompareFn)
    },
    updateChatListItemMessage: (state, action: PayloadAction<{ receiverId: number; latestMsg: any }>) => {
      const { receiverId, latestMsg } = action.payload
      let idx = findRoomIndex(receiverId, state.archived)
      if (idx !== null) {
        let convoItem = state.archived.splice(idx, 1)[0]
        convoItem.chat.archived = false
        state.unarchived.push(convoItem)
        _unarchiveChat(receiverId)
      }
      idx = findRoomIndex(receiverId, state.unarchived)
      if (idx !== null) {
        let convoItem = state.unarchived[idx]
        convoItem.latestMsg = latestMsg
        state.unarchived.sort(sortConvoCompareFn)
      }
    },
    updateChatListItemMessageStatus: (
      state,
      action: PayloadAction<{
        receiverId: number
        messageId: number
        latestMsgStatus: Exclude<MessageStatus, MessageStatus.SENDING>
      }>,
    ) => {
      const { receiverId, messageId, latestMsgStatus } = action.payload
      let idx = findRoomIndex(receiverId, state.unarchived)
      if (idx !== null) {
        const latestMsg = state.unarchived[idx].latestMsg
        if (latestMsg?.id === messageId) latestMsg.status = latestMsgStatus
        return
      }

      idx = findRoomIndex(receiverId, state.archived)
      if (idx !== null) {
        const latestMsg = state.archived[idx].latestMsg
        if (latestMsg?.id === messageId) latestMsg.status = latestMsgStatus
      }
    },
    archiveChat: (state, action: PayloadAction<number>) => {
      const receiverId = action.payload
      const idx = findRoomIndex(receiverId, state.unarchived)
      if (idx === null) return
      const convo = state.unarchived.splice(idx, 1)[0]
      convo.chat.archived = true
      if (convo.chat.pinned) {
        convo.chat.pinned = false
        _unpinChat(receiverId)
      }
      state.archived.push(convo)
      state.archived.sort(sortConvoCompareFn)
      _archiveChat(receiverId)
    },
    unarchiveChat: (state, action: PayloadAction<number>) => {
      const receiverId = action.payload
      const idx = findRoomIndex(receiverId, state.archived)
      if (idx === null) return
      const convo = state.archived.splice(idx, 1)[0]
      convo.chat.archived = false
      state.unarchived.push(convo)
      state.unarchived.sort(sortConvoCompareFn)
      _unarchiveChat(receiverId)
    },
    deleteChat: (state, action: PayloadAction<{ receiverId: number; archived: boolean }>) => {
      const { receiverId, archived } = action.payload
      const list = archived ? state.archived : state.unarchived
      const idx = findRoomIndex(receiverId, list)
      if (idx === null) return
      list.splice(idx, 1)
      // _deleteMessages(receiverId)
    },
  },
  selectors: {
    selectUnarchived: slice => slice.unarchived,
    selectArchived: slice => slice.archived,
  },
})

export const {
  setChats,
  insertUnarchivedChat,
  deleteChat,
  archiveChat,
  unarchiveChat,
  clearChatListItemMessage,
  deleteChatListItemContact,
  upsertChatListItemContact,
  updateChatListItemMessage,
  updateChatListItemMessagePin,
  updateChatListItemMessageStatus,
} = chatListSlice.actions

export const { selectArchived, selectUnarchived } = chatListSlice.selectors

function findRoomIndex(receiverId: number, list: ReadonlyArray<IChatListItem>): number | null {
  const idx = list.findIndex(val => val.receiver.id === receiverId)
  return idx === -1 ? null : idx
}

const sortConvoCompareFn = (a: Readonly<IChatListItem>, b: Readonly<IChatListItem>) => {
  // Pinned chats on top
  if (a.chat.pinned && !b.chat.pinned) return -1
  if (!a.chat.pinned && b.chat.pinned) return 1

  // Cleared convo's at bottom
  if (a.latestMsg !== null && b.latestMsg === null) return -1
  if (a.latestMsg === null && b.latestMsg !== null) return 1
  if (a.latestMsg === null && b.latestMsg === null) return 0

  // Latest convo on top
  if (new Date(a.latestMsg!.createdAt) > new Date(b.latestMsg!.createdAt)) return -1
  if (new Date(a.latestMsg!.createdAt) < new Date(b.latestMsg!.createdAt)) return 1
  return 0
}

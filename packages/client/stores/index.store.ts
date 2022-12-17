import create from 'zustand'
import { MessageType } from '../types/index.types'
import { type ChatListStoreType, useChatListStore } from './useChatListStore'
import { type ChatStoreType, useChatStore } from './useChatStore'
import { type ContactStoreType, useContactStore } from './useContactStore'
import { type DraftStoreType, useDraftStore } from './useDraftStore'
import { type NotificationStateType, useNotificationState } from './useNotificationState'
import { type SlideOverStateType, useSlideOverState } from './useSlideOverState'
import { type TypingStateType, useTypingState } from './useTypingState'

export interface StoreType
  extends ChatListStoreType,
    ChatStoreType,
    ContactStoreType,
    DraftStoreType,
    NotificationStateType,
    SlideOverStateType,
    TypingStateType {
  resetStore: () => void
}

export const useStore = create<StoreType>()((...a) => ({
  ...useChatListStore(...a),
  ...useChatStore(...a),
  ...useContactStore(...a),
  ...useDraftStore(...a),
  ...useNotificationState(...a),
  ...useSlideOverState(...a),
  ...useTypingState(...a),

  resetStore() {
    a[0]({
      activeChatInfo: null,
      activeRoomId: null,
      chatList: [],
      isProxyRoom: false,
      chats: new Map<number, Map<number, MessageType>>(),
      contacts: {},
      drafts: new Map<number, string>(),
      notification: {
        status: 'success',
        title: '',
        description: '',
        show: false,
      },
      typingState: {},
      slideOverState: {
        open: false,
        title: 'New Chat',
        componentName: 'ContactList',
      },
    })
  },
}))

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { MessageType } from '../types'
import { type ConvoStoreType, useConvoStore } from './slices/useConvoStore'
import { type ChatStoreType, useChatStore } from './slices/useChatStore'
import { type ContactStoreType, useContactStore } from './slices/useContactStore'
import { type DraftStoreType, useDraftStore } from './slices/useDraftStore'
import { type NotificationStateType, useNotificationState } from './slices/useNotificationState'
import { type SlideOverStateType, useSlideOverState } from './slices/useSlideOverState'
import { type TypingStateType, useTypingState } from './slices/useTypingState'

export interface StoreType
  extends ConvoStoreType,
    ChatStoreType,
    ContactStoreType,
    DraftStoreType,
    NotificationStateType,
    SlideOverStateType,
    TypingStateType {
  resetStore: () => void
}

export const useStore = create<StoreType>()(
  immer((...a) => ({
    ...useConvoStore(...a),
    ...useChatStore(...a),
    ...useContactStore(...a),
    ...useDraftStore(...a),
    ...useNotificationState(...a),
    ...useSlideOverState(...a),
    ...useTypingState(...a),

    resetStore() {
      a[0]({
        activeChatInfo: null,
        activeRoom: null,
        convo: [],
        isProxyConvo: false,
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
  })),
)

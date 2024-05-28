import { enableMapSet } from 'immer'
import { immer } from 'zustand/middleware/immer'
import { createWithEqualityFn } from 'zustand/traditional'
import { type ChatListStoreType, useChatListStore } from './slices/useChatListStore'
import { type MessageStoreType, useMessageStore } from './slices/useMessageStore'
import { type ContactStoreType, useContactStore } from './slices/useContactStore'
import { type DraftStoreType, useDraftStore } from './slices/useDraftStore'
import { type NotificationStateType, useNotificationState } from './slices/useNotificationState'
import { type TypingStateType, useTypingState } from './slices/useTypingState'

export interface StoreType
  extends ChatListStoreType,
    MessageStoreType,
    ContactStoreType,
    DraftStoreType,
    NotificationStateType,
    TypingStateType {}

enableMapSet()

export const useStore = createWithEqualityFn<StoreType>()(
  immer((...a) => ({
    ...useChatListStore(...a),
    ...useMessageStore(...a),
    ...useContactStore(...a),
    ...useDraftStore(...a),
    ...useNotificationState(...a),
    ...useTypingState(...a),
  })),
)

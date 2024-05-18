import { enableMapSet } from 'immer'
import { immer } from 'zustand/middleware/immer'
import { createWithEqualityFn } from 'zustand/traditional'
import { type ConvoStoreType, useConvoStore } from './slices/useConvoStore'
import { type ChatStoreType, useChatStore } from './slices/useChatStore'
import { type ContactStoreType, useContactStore } from './slices/useContactStore'
import { type DraftStoreType, useDraftStore } from './slices/useDraftStore'
import { type NotificationStateType, useNotificationState } from './slices/useNotificationState'
import { type TypingStateType, useTypingState } from './slices/useTypingState'

export interface StoreType
  extends ConvoStoreType,
    ChatStoreType,
    ContactStoreType,
    DraftStoreType,
    NotificationStateType,
    TypingStateType {}

enableMapSet()

export const useStore = createWithEqualityFn<StoreType>()(
  immer((...a) => ({
    ...useConvoStore(...a),
    ...useChatStore(...a),
    ...useContactStore(...a),
    ...useDraftStore(...a),
    ...useNotificationState(...a),
    ...useTypingState(...a),
  })),
)

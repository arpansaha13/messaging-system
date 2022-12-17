import create from 'zustand'
import { type ChatListStoreType, useChatListStore } from './useChatListStore'
import { type ChatStoreType, useChatStore } from './useChatStore'
import { type ContactStoreType, useContactStore } from './useContactStore'
import { type DraftStoreType, useDraftStore } from './useDraftStore'
import { type NotificationStateType, useNotificationState } from './useNotificationState'
import { type SlideOverStateType, useSlideOverState } from './useSlideOverState'
import { type TypingStateType, useTypingState } from './useTypingState'

export type StoreType = ChatListStoreType &
  ChatStoreType &
  ContactStoreType &
  DraftStoreType &
  NotificationStateType &
  SlideOverStateType &
  TypingStateType

export const useStore = create<StoreType>()((...a) => ({
  ...useChatListStore(...a),
  ...useChatStore(...a),
  ...useContactStore(...a),
  ...useDraftStore(...a),
  ...useNotificationState(...a),
  ...useSlideOverState(...a),
  ...useTypingState(...a),
}))

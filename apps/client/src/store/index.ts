import { enableMapSet } from 'immer'
import { immer } from 'zustand/middleware/immer'
import { createWithEqualityFn } from 'zustand/traditional'
import { authSlice } from './features/auth/authSlice'
import { chatListSlice } from './features/chat-list/chatListSlice'
import { contactSlice } from './features/contacts/contactsSlice'
import { messageSlice } from './features/messages/messagesSlice'
import { draftSlice } from './features/drafts/draftsSlice'
import { groupSlice } from './features/groups/groupsSlice'
import { notificationSlice } from './features/notification/notificationSlice'
import { typingSlice } from './features/typing/typingSlice'
import type { AuthSliceType } from './features/auth/types'
import type { ChatListSliceType } from './features/chat-list/types'
import type { ContactSliceType } from './features/contacts/types'
import type { MessageSliceType } from './features/messages/types'
import type { DraftSliceType } from './features/drafts/types'
import type { GroupSliceType } from './features/groups/types'
import type { NotificationSliceType } from './features/notification/types'
import type { TypingSliceType } from './features/typing/types'

export interface StoreType
  extends AuthSliceType,
    ChatListSliceType,
    ContactSliceType,
    MessageSliceType,
    DraftSliceType,
    GroupSliceType,
    NotificationSliceType,
    TypingSliceType {}

enableMapSet()

export const useStore = createWithEqualityFn<StoreType>()(
  immer((...a) => ({
    ...authSlice(...a),
    ...chatListSlice(...a),
    ...contactSlice(...a),
    ...messageSlice(...a),
    ...draftSlice(...a),
    ...groupSlice(...a),
    ...notificationSlice(...a),
    ...typingSlice(...a),
  })),
)

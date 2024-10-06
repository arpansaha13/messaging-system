import { enableMapSet } from 'immer'
import { immer } from 'zustand/middleware/immer'
import { createWithEqualityFn } from 'zustand/traditional'
import { authSlice } from './features/auth/auth.slice'
import { chatListSlice } from './features/chat-list/chat-list.slice'
import { contactSlice } from './features/contacts/contacts.slice'
import { messageSlice } from './features/messages/messages.slice'
import { draftSlice } from './features/drafts/drafts.slice'
import { groupSlice } from './features/groups/groups.slice'
import { channelSlice } from './features/channels/channels.slice'
import { notificationSlice } from './features/notification/notification.slice'
import { typingSlice } from './features/typing/typing.slice'
import type { AuthSliceType } from './features/auth/types'
import type { ChatListSliceType } from './features/chat-list/types'
import type { ContactSliceType } from './features/contacts/types'
import type { MessageSliceType } from './features/messages/types'
import type { DraftSliceType } from './features/drafts/types'
import type { GroupSliceType } from './features/groups/types'
import type { ChannelSliceType } from './features/channels/types'
import type { NotificationSliceType } from './features/notification/types'
import type { TypingSliceType } from './features/typing/types'

export interface StoreType
  extends AuthSliceType,
    ChatListSliceType,
    ContactSliceType,
    MessageSliceType,
    DraftSliceType,
    GroupSliceType,
    ChannelSliceType,
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
    ...channelSlice(...a),
    ...notificationSlice(...a),
    ...typingSlice(...a),
  })),
)

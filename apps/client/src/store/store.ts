import type { Action, ThunkAction } from '@reduxjs/toolkit'
import { combineSlices, configureStore } from '@reduxjs/toolkit'
import { enableMapSet } from 'immer'
import storage from 'redux-persist/lib/storage'
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, persistReducer } from 'redux-persist'
import { authSlice } from './features/auth/auth.slice'
import { draftSlice } from './features/drafts/draft.slice'
import { groupSlice } from './features/groups/group.slice'
import { typingSlice } from './features/typing/typing.slice'
import { contactSlice } from './features/contacts/contact.slice'
import { messageSlice } from './features/messages/message.slice'
import { channelSlice } from './features/channels/channel.slice'
import { chatListSlice } from './features/chat-list/chat-list.slice'
import { darkModeSlice } from './features/dark/dark.slice'
import { notificationSlice } from './features/notification/notification.slice'

enableMapSet()

const rootReducer = combineSlices(
  authSlice,
  draftSlice,
  groupSlice,
  typingSlice,
  contactSlice,
  messageSlice,
  channelSlice,
  chatListSlice,
  darkModeSlice,
  notificationSlice,
)

const persistConfig = {
  key: 'root',
  storage: storage,
  whitelist: ['dark'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export type RootState = ReturnType<typeof rootReducer>

export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          ignoredPaths: [
            'draft.drafts',
            'typing.typingState',
            'message.userMessagesMap',
            'message.tempMessagesMap',
            'channel.channelsMap',
          ],
        },
      }),
    // .concat(quotesApiSlice.middleware),
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
export type AppThunk<ThunkReturnType = void> = ThunkAction<ThunkReturnType, RootState, unknown, Action>

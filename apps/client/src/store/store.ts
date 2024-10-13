import type { Action, ThunkAction } from '@reduxjs/toolkit'
import { combineSlices, configureStore } from '@reduxjs/toolkit'
import { enableMapSet } from 'immer'
import storage from 'redux-persist/lib/storage'
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, persistReducer } from 'redux-persist'
import { apiSlices, slices } from './features'

enableMapSet()

const rootReducer = combineSlices(...slices, ...apiSlices)

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
      }).concat(apiSlices.map(apiSlice => apiSlice.middleware)),
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
export type AppThunk<ThunkReturnType = void> = ThunkAction<ThunkReturnType, RootState, unknown, Action>

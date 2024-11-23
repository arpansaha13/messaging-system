'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { Persistor, persistStore } from 'redux-persist'
import { setupListeners } from '@reduxjs/toolkit/query'
import { PersistGate } from 'redux-persist/integration/react'
import { makeStore, type AppStore } from '~/store/store'

interface StoreProviderProps {
  children: ReactNode
}

export const StoreProvider = (props: Readonly<StoreProviderProps>) => {
  const { children } = props

  const storeRef = useRef<AppStore | null>(null)
  const persistorRef = useRef<Persistor | null>(null)

  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore()
    persistorRef.current = persistStore(storeRef.current)
  }

  useEffect(() => {
    if (storeRef.current != null) {
      // configure listeners using the provided defaults
      // optional, but required for `refetchOnFocus`/`refetchOnReconnect` behaviors
      const unsubscribe = setupListeners(storeRef.current.dispatch)
      return unsubscribe
    }
  }, [])

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistorRef.current!}>
        {children}
      </PersistGate>
    </Provider>
  )
}

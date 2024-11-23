'use client'

import { useEffect } from 'react'
import { SocketProvider } from '~/providers/SocketProvider'
import { Notification } from '~/components/common'
import Navbar from '~/components/Navbar'
import { useAppDispatch, usePrefetch } from '~/store/hooks'
import { initChatList } from '~/store/features/chat-list/chat-list.slice'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: Readonly<LayoutWrapperProps>) {
  usePrefetch('getAuthUser', undefined)
  usePrefetch('getGroups', undefined)
  usePrefetch('getContacts', undefined)

  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(initChatList())
  }, [dispatch])

  return (
    <SocketProvider>
      <div className="flex h-screen">
        <Notification />
        <Navbar />
        <main className="flex-grow">{children}</main>
      </div>
    </SocketProvider>
  )
}

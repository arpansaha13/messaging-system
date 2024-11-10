'use client'

import { useUnmount } from 'react-use'
import { useSocket } from '~/hooks/useSocket'
import { usePersonalChatSocketEvents } from './usePersonalChatSocketEvents'

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { closeSocket } = useSocket()

  usePersonalChatSocketEvents()

  useUnmount(closeSocket)

  return children
}

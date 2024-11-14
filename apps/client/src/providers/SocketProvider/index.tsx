'use client'

import { useUnmount } from 'react-use'
import { useSocket } from '~/hooks/useSocket'
import { usePersonalChatSocketEvents } from './usePersonalChatSocketEvents'
import { useGroupChatSocketEvents } from './useGroupChatSocketEvents'

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { closeSocket } = useSocket()

  usePersonalChatSocketEvents()
  useGroupChatSocketEvents()

  useUnmount(closeSocket)

  return children
}

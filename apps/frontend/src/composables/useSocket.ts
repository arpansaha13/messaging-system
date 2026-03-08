import type { Ref } from 'vue'
import { io, type Socket } from 'socket.io-client'

export interface SocketWrapper {
  socket: Ref<Socket | null>
  closeSocket: () => void
}

export async function useSocket(): Promise<SocketWrapper> {
  const socket = useState<Socket | null>('socket:instance', () => null)

  if (import.meta.client) {
    const { data: authUser, refresh: refreshAuth } = await useFetchAuthUser()
    const logger = useLogger('useSocket')

    watchEffect(async () => {
      const user = authUser.value

      // Disconnect if logged out
      if (!user) {
        if (socket.value) {
          logger.debug('User logged out, disconnecting socket')
          socket.value.disconnect()
          socket.value = null
        }
        return
      }

      // Skip if already connected
      if (socket.value?.connected) {
        return
      }

      logger.debug('Connecting socket for user', { userId: user.id })

      socket.value = io({
        withCredentials: true,
        query: {
          userId: user.id,
        },
        // Reconnection strategies
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
      })

      // Error handling
      socket.value.on('connect_error', (error: Error) => {
        logger.error('Socket connection error', error)
      })

      // Handle server-initiated disconnection
      socket.value.on('disconnect', (reason: string) => {
        logger.debug('Socket disconnected', { reason })

        if (reason === 'io server disconnect') {
          // Server disconnected us, likely due to auth issues
          logger.info('Server disconnected socket, refreshing auth')
          refreshAuth()
        }
      })

      // Log successful connection
      socket.value.on('connect', () => {
        logger.debug('Socket connected successfully')
      })
    })
  }

  function closeSocket() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  return {
    socket,
    closeSocket,
  }
}

import { useEffect, useState } from 'react'
import io from 'socket.io-client'
// Stores
import { useAuthStore } from '../stores/useAuthStore'
import { useChatStore } from '../stores/useChatStore'

type SocketOnEvents = 'connect' | 'disconnect' | 'chat'
type SocketEmitEvents = 'chat' | 'join' | 'session-connect'

const socket = io('http://localhost:4000', { autoConnect: true })

/** A socket wrapper to allow type security. */
const socketWrapper = {
  emit(event: SocketEmitEvents, data: any) {
    socket.emit(event, data)
  },
  on(event: SocketOnEvents, cb: () => void) {
    socket.on(event, cb)
  },
  off(event: SocketOnEvents) {
    socket.off(event)
  },
}

/**
 * Initialize web socket.
 *
 * This hook is meant to be run only once during app initialization.
 */
export function useSocketInit() {
  const authUser = useAuthStore(state => state.authUser)!
  const receive = useChatStore(state => state.receive)

  const [isConnected, setIsConnected] = useState<boolean>(socket.connected)
  const [_, setHookRunCount] = useState<number>(0)

  useEffect(() => {
    setHookRunCount(count => {
      if (count > 1) {
        console.warn(
          '`useSocketInit()` is run more than once. This will send multiple `session-connect` events to server. This hook is meant to be run only once during app initialization.',
        )
      }
      return count + 1
    })

    if (socket.connected)
      socketWrapper.emit('session-connect', { userId: authUser.id })

    socketWrapper.on('connect', () => {
      setIsConnected(true)
      socketWrapper.emit('session-connect', { userId: authUser.id })
    })

    socketWrapper.on('disconnect', () => {
      // Remember, we cannot emit events after disconnection.
      setIsConnected(false)
    })

    socketWrapper.on('chat', () => {})

    return () => {
      socketWrapper.off('connect')
      socketWrapper.off('disconnect')
      socketWrapper.off('chat')
    }
  }, [])

  return { isConnected, socket: socketWrapper }
}

/** Returns the socket wrapper. */
export function useSocket() {
  return { socket: socketWrapper }
}

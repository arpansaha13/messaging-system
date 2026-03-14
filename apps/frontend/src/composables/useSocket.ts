import type { Ref } from 'vue'

// Thin adapter that mimics Socket.IO's .on()/.off()/.emit() API
// over a native browser WebSocket with { "event": "...", "data": {...} } framing.
export interface SocketAdapter {
  on(event: string, handler: (data: unknown) => void): void
  off(event: string, handler: (data: unknown) => void): void
  emit(event: string, data: unknown): void
  readonly connected: boolean
  close(): void
}

export interface SocketWrapper {
  socket: Ref<SocketAdapter | null>
  closeSocket: () => void
}

function createAdapter(ws: WebSocket): SocketAdapter {
  const listeners = new Map<string, Set<(data: unknown) => void>>()

  ws.onmessage = event => {
    try {
      const frame = JSON.parse(event.data as string) as { event: string; data: unknown }
      listeners.get(frame.event)?.forEach(fn => fn(frame.data))
    } catch {
      // malformed frame — ignore
    }
  }

  return {
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(handler)
    },
    off(event, handler) {
      listeners.get(event)?.delete(handler)
    },
    emit(event, data) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event, data }))
      }
    },
    get connected() {
      return ws.readyState === WebSocket.OPEN
    },
    close() {
      ws.close(4000, 'intentional')
    },
  }
}

export async function useSocket(): Promise<SocketWrapper> {
  const socket = useState<SocketAdapter | null>('socket:instance', () => null)
  let retryTimeoutId: ReturnType<typeof setTimeout> | null = null

  if (import.meta.client) {
    const { data: authUser, refresh: refreshAuth } = await useFetchAuthUser()
    const logger = useLogger('useSocket')

    watchEffect(() => {
      const user = authUser.value

      // Disconnect if logged out
      if (!user) {
        if (retryTimeoutId !== null) {
          clearTimeout(retryTimeoutId)
          retryTimeoutId = null
        }
        if (socket.value) {
          logger.debug('User logged out, disconnecting socket')
          socket.value.close()
          socket.value = null
        }
        return
      }

      // Skip if already connected
      if (socket.value?.connected) {
        return
      }

      logger.debug('Connecting socket for user', { userId: user.id })
      connectWithRetry(user.id)
    })

    function connectWithRetry(userId: number, attempt = 0, maxAttempts = 10, baseDelay = 1000, maxDelay = 5000) {
      const ws = new WebSocket(`/ws/socket?userId=${userId}`)
      const adapter = createAdapter(ws)

      ws.onopen = () => {
        logger.debug('Socket connected successfully')
        socket.value = adapter
      }

      ws.onerror = err => {
        logger.error('Socket connection error', err)
      }

      ws.onclose = event => {
        socket.value = null
        logger.debug('Socket disconnected', { code: event.code, reason: event.reason })

        if (event.code === 4000) return // intentional close — no retry

        if (attempt >= maxAttempts) {
          logger.info('Max reconnection attempts reached, refreshing auth')
          refreshAuth()
          return
        }

        const delay = Math.min(baseDelay * 2 ** attempt, maxDelay)
        retryTimeoutId = setTimeout(() => {
          retryTimeoutId = null
          if (authUser.value) {
            connectWithRetry(userId, attempt + 1, maxAttempts, baseDelay, maxDelay)
          }
        }, delay)
      }
    }
  }

  function closeSocket() {
    if (retryTimeoutId !== null) {
      clearTimeout(retryTimeoutId)
      retryTimeoutId = null
    }
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
  }

  return {
    socket,
    closeSocket,
  }
}

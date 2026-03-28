import WebSocket from 'ws'
import { SOCKET_BASE_URL, SOCKET_ORIGIN } from './config'
import { poll, sleep } from './poll'

export interface SocketEnvelope<T = unknown> {
  event: string
  data: T
}

export async function connectWebSocket(sessionToken: string): Promise<WebSocket> {
  const url = `${SOCKET_BASE_URL.replace(/^http/, 'ws')}/ws/socket`
  const ws = new WebSocket(url, {
    headers: {
      Cookie: `session=${sessionToken}`,
      Origin: SOCKET_ORIGIN,
    },
  })

  // Keep a default error listener to avoid unhandled ws errors.
  ws.on('error', () => {})

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('WebSocket connection timed out'))
    }, 5_000)

    const onOpen = () => {
      cleanup()
      resolve()
    }
    const onError = (err: Error) => {
      cleanup()
      reject(err)
    }
    const onUnexpected = (_req: unknown, res: { statusCode?: number }) => {
      cleanup()
      reject(new Error(`WebSocket rejected with status ${res.statusCode}`))
    }

    const cleanup = () => {
      clearTimeout(timer)
      ws.off('open', onOpen)
      ws.off('error', onError)
      ws.off('unexpected-response', onUnexpected)
    }

    ws.once('open', onOpen)
    ws.once('error', onError)
    ws.once('unexpected-response', onUnexpected)
  })

  return ws
}

export function sendEvent<T>(ws: WebSocket, event: string, data: T): void {
  const payload = JSON.stringify({ event, data })
  ws.send(payload)
}

export async function waitForEvent<T>(
  ws: WebSocket,
  event: string,
  timeoutMs = 10_000,
): Promise<SocketEnvelope<T>> {
  const startedAt = Date.now()

  return new Promise((resolve, reject) => {
    const onMessage = (raw: WebSocket.RawData) => {
      try {
        const message = JSON.parse(raw.toString()) as SocketEnvelope<T>
        if (message.event === event) {
          cleanup()
          resolve(message)
        }
      } catch (err) {
        cleanup()
        reject(err)
      }
    }

    const onError = (err: Error) => {
      cleanup()
      reject(err)
    }

    const timer = setInterval(() => {
      if (Date.now() - startedAt > timeoutMs) {
        cleanup()
        reject(new Error(`Timed out waiting for ws event: ${event}`))
      }
    }, 250)

    const cleanup = () => {
      clearInterval(timer)
      ws.off('message', onMessage)
      ws.off('error', onError)
    }

    ws.on('message', onMessage)
    ws.on('error', onError)
  })
}

export async function waitForSocketClose(ws: WebSocket, timeoutMs = 10_000): Promise<void> {
  await poll(
    () => ws.readyState,
    (state) => state === WebSocket.CLOSED,
    { timeoutMs, intervalMs: 250, description: 'websocket close' },
  )
}

export async function closeSocket(ws: WebSocket): Promise<void> {
  if (ws.readyState === WebSocket.CLOSED) return
  ws.close()
  await waitForSocketClose(ws)
}

export async function waitForSilence(ms = 1_500): Promise<void> {
  await sleep(ms)
}

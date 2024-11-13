import { useMemo } from 'react'
import io, { type Socket } from 'socket.io-client'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import type { SocketEvents } from '@shared/constants'
import type { SocketEventPayloads } from '@shared/types'

export interface SocketOnEventPayload {
  [SocketEvents.PERSONAL.MESSAGE_RECEIVE]: SocketEventPayloads.Personal.OnMessage
  [SocketEvents.PERSONAL.STATUS_SENT]: SocketEventPayloads.Personal.OnSent
  [SocketEvents.PERSONAL.STATUS_DELIVERED]: SocketEventPayloads.Personal.OnDelivered
  [SocketEvents.PERSONAL.STATUS_READ]: SocketEventPayloads.Personal.OnRead[]
  [SocketEvents.PERSONAL.TYPING]: SocketEventPayloads.Personal.OnTyping
}

export interface SocketEmitEventPayload {
  [SocketEvents.PERSONAL.MESSAGE_SEND]: SocketEventPayloads.Personal.EmitMessage
  [SocketEvents.PERSONAL.STATUS_DELIVERED]: SocketEventPayloads.Personal.EmitDelivered
  [SocketEvents.PERSONAL.TYPING]: SocketEventPayloads.Personal.EmitTyping
  [SocketEvents.PERSONAL.STATUS_READ]: SocketEventPayloads.Personal.EmitRead | SocketEventPayloads.Personal.EmitRead[]
}

type SocketEmitEvent = keyof SocketEmitEventPayload
type SocketOnEvent = keyof SocketOnEventPayload

interface ISocketWrapper {
  emit<T extends SocketEmitEvent>(event: T, payload: SocketEmitEventPayload[T], ack?: (res: any) => void): void
  on<T extends SocketOnEvent>(event: T, listener: (payload: SocketOnEventPayload[T]) => void): void
  off(event: SocketOnEvent): void
}

interface UseSocketResult {
  socket: ISocketWrapper | null
  closeSocket: () => void
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_IO_BASE_URL!

let socket: Socket | null = null

export function useSocket(): UseSocketResult {
  const { data: authUser, isSuccess } = useGetAuthUserQuery()

  const socketWrapper = useMemo<ISocketWrapper | null>(() => {
    if (isNullOrUndefined(socket) && isSuccess) {
      socket = io(SOCKET_URL, {
        autoConnect: true,
        query: {
          userId: authUser.id,
          channels: authUser.channels,
        },
      })
    }
    if (socket) return createSocketWrapper()
    return null
  }, [isSuccess, authUser])

  const closeSocket = () => {
    if (socket) {
      socket.close()
      socket = null
    }
  }

  return { socket: socketWrapper, closeSocket }
}

function createSocketWrapper(): ISocketWrapper {
  return {
    emit(event, payload, ack) {
      if (ack) socket!.emit(event, payload, ack)
      else socket!.emit(event, payload)
    },
    on(event, listener) {
      socket!.on(event as any, listener)
    },
    off(event) {
      socket!.off(event)
    },
  }
}

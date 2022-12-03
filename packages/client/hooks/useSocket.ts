import { useEffect, useState } from 'react'
import io from 'socket.io-client'
// Stores
import { useAuthStore } from '../stores/useAuthStore'
import { useChatStore } from '../stores/useChatStore'
import { useTypingState } from '../stores/useTypingState'
import { useChatListStore } from '../stores/useChatListStore'
// Enum
import { MessageStatus } from '../types/message.types'

interface ReceiveMsgType {
  userId: number
  msg: string
  ISOtime: string
}
interface MsgStatusUpdateType {
  /** The chats are mapped with receiver user_id. */
  receiverId: number
  ISOtime: string
  status: Exclude<MessageStatus, MessageStatus.SENDING>
}
export interface TypingStateType {
  isTyping: boolean
  /** Id of the user who is typing a message. */
  senderId: number
  /** Id of the user for whom the message is being typed. */
  // TODO: remove this data from response. `receiverId` is not used.
  receiverId: number
}

type SocketOnEvents = 'connect' | 'disconnect' | 'receive-message' | 'message-status' | 'typing-state'
type SocketEmitEvents = 'send-message' | 'join' | 'session-connect' | 'typing-state'

const socket = io('http://localhost:4000', { autoConnect: true })

/** A socket wrapper to allow type security. */
const socketWrapper = {
  emit(event: SocketEmitEvents, data: any, ack?: (res: any) => void) {
    if (ack) socket.emit(event, data, ack)
    else socket.emit(event, data)
  },
  on(event: SocketOnEvents, listener: (...args: any[]) => void) {
    socket.on(event, listener)
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
  const updateStatus = useChatStore(state => state.updateStatus)
  const setTyping = useTypingState(state => state.setTyping)
  const updateChatListItem = useChatListStore(state => state.updateChatListItem)

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

    if (socket.connected) socketWrapper.emit('session-connect', { userId: authUser.id })

    socketWrapper.on('connect', () => {
      setIsConnected(true)
      socketWrapper.emit('session-connect', { userId: authUser.id })
    })

    socketWrapper.on('disconnect', () => {
      // Remember, we cannot emit events after disconnection.
      setIsConnected(false)
    })

    socketWrapper.on('receive-message', (data: ReceiveMsgType) => {
      receive(data.userId, data.msg, data.ISOtime)
      updateChatListItem(data.userId, {
        time: data.ISOtime,
        latestMsg: data.msg,
        status: null,
      })
    })

    socketWrapper.on('message-status', (data: MsgStatusUpdateType) => {
      updateStatus(data.receiverId, data.ISOtime, data.status)
      updateChatListItem(data.receiverId, {
        status: data.status,
      })
    })

    socketWrapper.on('typing-state', (data: TypingStateType) => {
      setTyping(data.senderId, data.isTyping)
    })

    return () => {
      socketWrapper.off('connect')
      socketWrapper.off('disconnect')
      socketWrapper.off('receive-message')
      socketWrapper.off('message-status')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { isConnected, socket: socketWrapper }
}

/** Returns the socket wrapper. */
export function useSocket() {
  return { socket: socketWrapper }
}

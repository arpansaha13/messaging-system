import { useEffect, useState } from 'react'
import io from 'socket.io-client'
import shallow from 'zustand/shallow'
// Stores
import { useStore } from '../stores/index.store'
import { useAuthStore } from '../stores/useAuthStore'
// Types
import { MessageStatus } from '../types/message.types'
import type { ConvoItemType } from '../types/index.types'

interface ReceiveMsgType {
  roomId: number
  senderId: number
  content: string
  ISOtime: string
}
interface MsgStatusUpdateType {
  roomId: number
  ISOtime: string
  status: Exclude<MessageStatus, MessageStatus.SENDING>
}
type SendMsgNewRoomType = {
  userToRoomId: ConvoItemType['userToRoomId']
  room: ConvoItemType['room']
  latestMsg: NonNullable<ConvoItemType['latestMsg']>
}
export interface TypingStateType {
  roomId: number
  isTyping: boolean
}

type SocketOnEvents =
  | 'connect'
  | 'disconnect'
  | 'receive-message'
  | 'message-status'
  | 'typing-state'
  | 'message-to-new-or-revived-room'
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
  const [
    setTyping,
    addChat,
    receive,
    updateStatus,
    getActiveChatInfo,
    setProxyConvo,
    addNewItemToTop,
    setActiveRoom,
    updateConvoItem,
    updateConvoItemStatus,
  ] = useStore(
    state => [
      state.setTypingState,
      state.addChat,
      state.receiveMsg,
      state.updateMsgStatus,
      state.getActiveChatInfo,
      state.setProxyConvo,
      state.addNewConvoItemToTop,
      state.setActiveRoom,
      state.updateConvoItem,
      state.updateConvoItemStatus,
    ],
    shallow,
  )

  const [isConnected, setIsConnected] = useState<boolean>(socket.connected)
  const [, setHookRunCount] = useState<number>(0)

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
      receive(data.roomId, data.content, data.senderId, data.ISOtime)
      updateConvoItem(data.roomId, {
        content: data.content,
        createdAt: data.ISOtime,
        senderId: data.senderId,
        status: null,
      })
    })

    socketWrapper.on('message-to-new-or-revived-room', (data: SendMsgNewRoomType) => {
      // Add a new item in chat-list
      const newConvoItem: ConvoItemType = {
        userToRoomId: data.userToRoomId,
        contact: getActiveChatInfo()!.contact,
        user: getActiveChatInfo()!.user,
        room: data.room,
        latestMsg: data.latestMsg,
      }
      addNewItemToTop(newConvoItem)
      addChat(data.room.id, [data.latestMsg])
      setActiveRoom(data.room)
      setProxyConvo(false)
    })

    socketWrapper.on('message-status', (data: MsgStatusUpdateType) => {
      updateStatus(data.roomId, data.ISOtime, data.status)
      updateConvoItemStatus(data.roomId, data.status)
    })

    socketWrapper.on('typing-state', (data: TypingStateType) => {
      setTyping(data.roomId, data.isTyping)
    })

    return () => {
      socketWrapper.off('connect')
      socketWrapper.off('disconnect')
      socketWrapper.off('receive-message')
      socketWrapper.off('message-status')
      socketWrapper.off('typing-state')
      socketWrapper.off('message-to-new-or-revived-room')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { isConnected, socket: socketWrapper }
}

/** Returns the socket wrapper. */
export function useSocket() {
  return { socket: socketWrapper }
}

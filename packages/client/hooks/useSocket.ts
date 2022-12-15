import { useEffect, useState } from 'react'
import io from 'socket.io-client'
// Stores
import { useAuthStore } from '../stores/useAuthStore'
import { useChatStore } from '../stores/useChatStore'
import { useTypingState } from '../stores/useTypingState'
import { useChatListStore } from '../stores/useChatListStore'
// Types
import { MessageStatus } from '../types/message.types'
import type { ChatListItemType } from '../types/index.types'

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
  userToRoomId: ChatListItemType['userToRoomId']
  room: ChatListItemType['room']
  latestMsg: NonNullable<ChatListItemType['latestMsg']>
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
  | 'send-message-new-room'
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
  const setTyping = useTypingState(state => state.setTyping)

  const addChat = useChatStore(state => state.add)
  const receive = useChatStore(state => state.receive)
  const updateStatus = useChatStore(state => state.updateStatus)
  const activeChatInfo = useChatStore(state => state.activeChatInfo)

  const setProxyRoom = useChatListStore(state => state.setProxyRoom)
  const addNewItemToTop = useChatListStore(state => state.addNewItemToTop)
  const setActiveRoomId = useChatListStore(state => state.setActiveRoomId)
  const updateChatListItem = useChatListStore(state => state.updateChatListItem)
  const updateChatListItemStatus = useChatListStore(state => state.updateChatListItemStatus)

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
      updateChatListItem(data.roomId, {
        content: data.content,
        createdAt: data.ISOtime,
        senderId: data.senderId,
        status: null,
      })
    })

    socketWrapper.on('send-message-new-room', (data: SendMsgNewRoomType) => {
      // Add a new item in chat-list
      const newChatListItem: ChatListItemType = {
        userToRoomId: data.userToRoomId,
        contact: activeChatInfo!.contact,
        user: activeChatInfo!.user,
        room: data.room,
        latestMsg: data.latestMsg,
      }
      addNewItemToTop(newChatListItem)
      addChat(data.room.id, [data.latestMsg])
      setActiveRoomId(data.room.id)
      setProxyRoom(false)
    })

    socketWrapper.on('message-status', (data: MsgStatusUpdateType) => {
      updateStatus(data.roomId, data.ISOtime, data.status)
      updateChatListItemStatus(data.roomId, data.status)
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
      socketWrapper.off('send-message-new-room')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { isConnected, socket: socketWrapper }
}

/** Returns the socket wrapper. */
export function useSocket() {
  return { socket: socketWrapper }
}

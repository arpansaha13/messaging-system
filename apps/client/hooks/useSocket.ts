import { useEffect, useState } from 'react'
import io from 'socket.io-client'
import shallow from 'zustand/shallow'
// Custom Hook
import { useFetch } from './useFetch'
// Stores
import { useStore } from '../stores/index.store'
import { useAuthStore } from '../stores/useAuthStore'
// Utils
import { isUnread } from '../utils'
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
  senderId: number
  status: Exclude<MessageStatus, MessageStatus.SENDING>
}
interface AllMsgStatusUpdateType {
  roomId: number
  senderId: number
  status: Exclude<MessageStatus, MessageStatus.SENDING | MessageStatus.SENT>
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
  | 'all-message-status'
  | 'typing-state'
  | 'message-to-new-or-revived-room'

type SocketEmitEvents = 'send-message' | 'join' | 'session-connect' | 'typing-state' | 'opened-or-read-chat'

const SOCKET_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:4000/' : process.env.NEXT_PUBLIC_BASE_URL!

const socket = io(SOCKET_URL, { autoConnect: true })

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
  const fetchHook = useFetch()
  const authUser = useAuthStore(state => state.authUser)!
  const [
    activeRoom,
    getChats,
    getActiveRoom,
    getActiveChatInfo,
    setTyping,
    setProxyConvo,
    setActiveRoom,
    addChat,
    receiveMsg,
    updateMsgStatus,
    updateAllMsgStatus,
    addNewConvoItem,
    updateConvoItem,
    updateConvoItemStatus,
    searchConvoByUserId,
  ] = useStore(
    state => [
      state.activeRoom,
      state.getChats,
      state.getActiveRoom,
      state.getActiveChatInfo,
      state.setTypingState,
      state.setProxyConvo,
      state.setActiveRoom,
      state.addChat,
      state.receiveMsg,
      state.updateMsgStatus,
      state.updateAllMsgStatus,
      state.addNewConvoItem,
      state.updateConvoItem,
      state.updateConvoItemStatus,
      state.searchConvoByUserId,
    ],
    shallow,
  )

  // TODO: refactor the store - combine activeRoom and activeChatInfo

  useEffect(() => {
    if (activeRoom === null) return

    const activeChatInfo = getActiveChatInfo()!
    const convo = searchConvoByUserId(activeChatInfo.user.id)!

    // Emit this event only when there are unread messages which have been read
    if (!isUnread(authUser.id, convo.latestMsg)) return

    socketWrapper.emit('opened-or-read-chat', {
      roomId: activeRoom.id,
      senderId: activeChatInfo.user.id,
    })
    // Update the sender's msg status to update the reader's (auth-user's) unread state
    updateAllMsgStatus(activeRoom.id, MessageStatus.READ, activeChatInfo.user.id)
    updateConvoItemStatus(activeRoom.id, MessageStatus.READ, activeChatInfo.user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom])

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
      const msg = {
        content: data.content,
        createdAt: data.ISOtime,
        senderId: data.senderId,
      }
      updateConvoItem(data.roomId, { ...msg, status: MessageStatus.DELIVERED }, fetchHook)
      // No need to update status if the chat has never been fetched
      // Because they will arrive with proper data whenever fetched (updated on server)
      const updatedChats = getChats()
      if (updatedChats.has(data.roomId)) {
        receiveMsg(data.roomId, msg)

        const updatedActiveRoom = getActiveRoom()!
        // If the receiver has the chat opened
        if (updatedActiveRoom && updatedActiveRoom.id === data.roomId) {
          socketWrapper.emit('opened-or-read-chat', {
            roomId: updatedActiveRoom.id,
            ISOtime: data.ISOtime,
            senderId: data.senderId,
          })
          updateConvoItemStatus(data.roomId, MessageStatus.READ, data.senderId)
        }
      }
    })

    socketWrapper.on('message-to-new-or-revived-room', (data: SendMsgNewRoomType) => {
      // Add a new item in chat-list
      const activeChatInfo = getActiveChatInfo()!
      const newConvoItem: ConvoItemType = {
        userToRoomId: data.userToRoomId,
        contact: activeChatInfo.contact,
        user: activeChatInfo.user,
        room: data.room,
        latestMsg: data.latestMsg,
      }
      addNewConvoItem(newConvoItem)
      addChat(data.room.id, [data.latestMsg])
      setActiveRoom(data.room)
      setProxyConvo(false)
    })

    socketWrapper.on('message-status', (data: MsgStatusUpdateType) => {
      updateMsgStatus(data.roomId, data.ISOtime, data.status)
      updateConvoItemStatus(data.roomId, data.status, data.senderId)
    })

    socketWrapper.on('all-message-status', (data: AllMsgStatusUpdateType) => {
      updateAllMsgStatus(data.roomId, data.status, data.senderId)
      updateConvoItemStatus(data.roomId, data.status, data.senderId)
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
      socketWrapper.off('all-message-status')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { isConnected, socket: socketWrapper }
}

/** Returns the socket wrapper. */
export function useSocket() {
  return { socket: socketWrapper }
}

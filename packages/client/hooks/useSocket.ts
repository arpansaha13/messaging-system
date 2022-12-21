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
  status: MessageStatus.DELIVERED
}
interface MsgStatusUpdateType {
  roomId: number
  ISOtime: string
  status: Exclude<MessageStatus, MessageStatus.SENDING>
}
interface AllMsgStatusUpdateType {
  roomId: number
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
    ],
    shallow,
  )

  // TODO: refactor the store - combine activeRoom and activeChatInfo

  useEffect(() => {
    if (activeRoom === null) return
    const activeChatInfo = getActiveChatInfo()!
    // TODO: Emit this event only when there are unread messages which have been read
    // Currently this event gets emitted whenever a user changes room
    socketWrapper.emit('opened-or-read-chat', {
      roomId: activeRoom.id,
      senderId: activeChatInfo.user.id,
    })
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
      updateConvoItem(data.roomId, {
        ...msg,
        status: MessageStatus.DELIVERED,
      })
      // No need to update status if the chat has never been fetched
      // Because they will arrive with proper data whenever fetched (updated on server)
      const updatedChats = getChats()
      if (updatedChats.has(data.roomId)) {
        receiveMsg(data.roomId, msg)

        const updatedActiveRoom = getActiveRoom()!
        if (updatedActiveRoom && updatedActiveRoom.id === data.roomId) {
          const activeChatInfo = getActiveChatInfo()!
          socketWrapper.emit('opened-or-read-chat', {
            roomId: updatedActiveRoom.id,
            ISOtime: data.ISOtime,
            senderId: activeChatInfo.user.id,
          })
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
      updateConvoItemStatus(data.roomId, data.status)
    })

    socketWrapper.on('all-message-status', (data: AllMsgStatusUpdateType) => {
      updateAllMsgStatus(data.roomId, data.status)
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

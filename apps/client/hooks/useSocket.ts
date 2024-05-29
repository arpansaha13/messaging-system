import { useEffect, useState } from 'react'
import io from 'socket.io-client'
import { shallow } from 'zustand/shallow'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { useStore } from '~/store'
import { useAuthStore } from '~/store/useAuthStore'
import _fetch from '~/utils/_fetch'
import isUnread from '~/utils/isUnread'
import { MessageStatus } from '@pkg/types'
import type {
  IChatListItem,
  IMessage,
  IReceiverEmitRead,
  SocketEmitEvent,
  SocketEmitEventPayload,
  SocketOnEvent,
  SocketOnEventPayload,
} from '@pkg/types'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_IO_BASE_URL!

const socket = io(SOCKET_URL, { autoConnect: true })

/** A socket wrapper to allow type security. */
const socketWrapper = {
  emit<T extends SocketEmitEvent>(event: T, payload: SocketEmitEventPayload[T], ack?: (res: any) => void) {
    if (ack) socket.emit(event, payload, ack)
    else socket.emit(event, payload)
  },
  on<T extends SocketOnEvent>(event: T, listener: (payload: SocketOnEventPayload[T]) => void) {
    socket.on(event as any, listener)
  },
  off(event: SocketOnEvent) {
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
    activeChat,
    userMessagesMap,
    getUserMessagesMap,
    setTyping,
    updateMessageStatus,
    updateChatListItemMessage,
    updateChatListItemMessageStatus,
    searchChat,
    upsertMessages,
    getTempMessage,
    deleteTempMessage,
    unarchiveChat,
    insertUnarchivedChat,
  ] = useStore(
    state => [
      state.activeChat,
      state.userMessagesMap,
      state.getUserMessagesMap,
      state.setTypingState,
      state.updateMessageStatus,
      state.updateChatListItemMessage,
      state.updateChatListItemMessageStatus,
      state.searchChat,
      state.upsertMessages,
      state.getTempMessage,
      state.deleteTempMessage,
      state.unarchiveChat,
      state.insertUnarchivedChat,
    ],
    shallow,
  )

  useEffect(() => {
    if (isNullOrUndefined(activeChat)) return

    const convo = searchChat(activeChat.receiver.id)!

    if (isNullOrUndefined(convo)) return
    if (!isUnread(authUser.id, convo.latestMsg)) return

    const userMessagesMap = getUserMessagesMap()
    const messages = userMessagesMap.get(activeChat.receiver.id)

    if (isNullOrUndefined(messages)) return

    const readEventPayload: IReceiverEmitRead[] = []

    for (const message of messages.values()) {
      if (message.senderId === authUser.id || message.status === MessageStatus.READ) continue

      readEventPayload.push({
        messageId: message.id,
        senderId: activeChat.receiver.id,
        receiverId: authUser.id,
      })

      updateChatListItemMessageStatus(activeChat.receiver.id, message.id, MessageStatus.READ)
      updateMessageStatus(activeChat.receiver.id, message.id, MessageStatus.READ)
    }

    socket.emit('read', readEventPayload)
  }, [activeChat, authUser, userMessagesMap])

  const [isConnected, setIsConnected] = useState<boolean>(socket.connected)
  const [, setHookRunCount] = useState<number>(0)

  useEffect(() => {
    if (isNullOrUndefined(authUser)) return

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
      // Note: We cannot emit events after disconnection.
      setIsConnected(false)
    })

    socketWrapper.on('receive-message', async payload => {
      const message: IMessage = {
        id: payload.messageId,
        content: payload.content,
        createdAt: payload.createdAt,
        senderId: payload.senderId,
        status: MessageStatus.DELIVERED,
      }
      const convoExists = !isNullOrUndefined(searchChat(payload.senderId))

      if (convoExists) {
        unarchiveChat(payload.senderId)
        updateChatListItemMessage(payload.senderId, message)
      } else {
        const convo: IChatListItem = await _fetch(`chats/${payload.senderId}`)
        convo.latestMsg = message
        insertUnarchivedChat(convo)
      }

      socketWrapper.emit('delivered', {
        messageId: message.id,
        receiverId: authUser.id,
        senderId: payload.senderId,
      })

      // No need to update status if the chat has never been fetched
      // Because they will arrive with proper data whenever fetched (updated on server)
      const updatedChats = getUserMessagesMap()
      if (!updatedChats.has(payload.senderId)) return

      upsertMessages(payload.senderId, [message])
    })

    socketWrapper.on('sent', async payload => {
      const tempMessage = getTempMessage(payload.receiverId, payload.hash)

      const message: IMessage = {
        id: payload.messageId,
        content: tempMessage.content,
        createdAt: payload.createdAt,
        senderId: authUser.id,
        status: payload.status,
      }

      const convoExists = !isNullOrUndefined(searchChat(payload.receiverId))

      if (convoExists) {
        updateChatListItemMessage(payload.receiverId, message)
      } else {
        const convo: IChatListItem = await _fetch(`chats/${payload.receiverId}`)
        convo.latestMsg = message
        insertUnarchivedChat(convo)
      }

      // Temp message should be deleted after fetching the new convo
      // Otherwise there will be a delay for "sent" message to appear until the fetch is complete
      deleteTempMessage(payload.receiverId, payload.hash)
      upsertMessages(payload.receiverId, [message])
    })

    socketWrapper.on('delivered', payload => {
      updateChatListItemMessageStatus(payload.receiverId, payload.messageId, payload.status)
      updateMessageStatus(payload.receiverId, payload.messageId, payload.status)
    })

    socketWrapper.on('read', payloadArray => {
      payloadArray.forEach(p => {
        updateChatListItemMessageStatus(p.receiverId, p.messageId, p.status)
        updateMessageStatus(p.receiverId, p.messageId, p.status)
      })
    })

    socketWrapper.on('typing', payload => {
      setTyping(payload.senderId, payload.isTyping)
    })

    return () => {
      socketWrapper.off('connect')
      socketWrapper.off('disconnect')
      socketWrapper.off('receive-message')
      socketWrapper.off('sent')
      socketWrapper.off('delivered')
      socketWrapper.off('read')
      socketWrapper.off('typing')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser])

  return { isConnected, socket: socketWrapper }
}

/** Returns the socket wrapper. */
export function useSocket() {
  return { socket: socketWrapper }
}

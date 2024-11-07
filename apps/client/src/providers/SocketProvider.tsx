'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import io from 'socket.io-client'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import {
  updateChatListItemMessage,
  updateChatListItemMessageStatus,
  unarchiveChat,
  insertUnarchivedChat,
  selectArchived,
  selectUnarchived,
  getChatByReceiverId,
} from '~/store/features/chat-list/chat-list.slice'
import {
  deleteTempMessage,
  selectTempMessagesMap,
  selectUserMessagesMap,
  updateMessageStatus,
  upsertMessages,
} from '~/store/features/messages/message.slice'
import isUnread from '~/utils/isUnread'
import { setTypingState } from '~/store/features/typing/typing.slice'
import { useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import {} from '@shared/types'
import type { IChatListItem, IUser } from '@shared/types/client'
import {
  MessageStatus,
  SocketEmitEvent,
  SocketOnEvent,
  type IMessage,
  type IReceiverEmitRead,
  type SocketEmitEventPayload,
  type SocketOnEventPayload,
} from '@shared/types'

interface ISocketWrapper {
  emit<T extends SocketEmitEvent>(event: T, payload: SocketEmitEventPayload[T], ack?: (res: any) => void): void

  on<T extends SocketOnEvent>(event: T, listener: (payload: SocketOnEventPayload[T]) => void): void

  off(event: SocketOnEvent): void
}

interface ISocketContext {
  socket: ISocketWrapper
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_IO_BASE_URL!

function searchChat(chatList: IChatListItem[], receiverId: IUser['id']) {
  return chatList.find(item => item.receiver.id === receiverId) ?? null
}

function useSocketInit() {
  const dispatch = useAppDispatch()
  const { data: authUser, isSuccess } = useGetAuthUserQuery()
  const searchParams = useSearchParams()
  const receiverId = useMemo(() => (searchParams.has('to') ? parseInt(searchParams.get('to')!) : null), [searchParams])
  const archivedChatList = useAppSelector(selectArchived)
  const unarchivedChatList = useAppSelector(selectUnarchived)
  const userMessagesMap = useAppSelector(selectUserMessagesMap)
  const tempMessagesMap = useAppSelector(selectTempMessagesMap)

  const socket = useMemo(() => {
    if (!isSuccess) return null
    return io(SOCKET_URL, { autoConnect: true, query: { userId: authUser.id } })
  }, [authUser, isSuccess])

  /** A socket wrapper to allow type security. */
  const socketWrapper = useMemo<ISocketWrapper>(
    () => ({
      emit(event, payload, ack) {
        if (ack) socket?.emit(event, payload, ack)
        else socket?.emit(event, payload)
      },
      on(event, listener) {
        socket?.on(event as any, listener)
      },
      off(event) {
        socket?.off(event)
      },
    }),
    [socket],
  )

  useEffect(() => {
    if (isNullOrUndefined(receiverId) || !isSuccess) return

    const convo = searchChat(unarchivedChatList, receiverId) ?? searchChat(archivedChatList, receiverId)!

    if (isNullOrUndefined(convo)) return
    if (!isUnread(authUser.id, convo.latestMsg)) return

    const messages = userMessagesMap.get(receiverId)

    if (isNullOrUndefined(messages)) return

    const readEventPayload: IReceiverEmitRead[] = []

    for (const message of messages.values()) {
      if (message.senderId === authUser.id || message.status === MessageStatus.READ) continue

      readEventPayload.push({
        messageId: message.id,
        senderId: receiverId,
        receiverId: authUser.id,
      })

      dispatch(
        updateChatListItemMessageStatus({
          receiverId: receiverId,
          messageId: message.id,
          latestMsgStatus: MessageStatus.READ,
        }),
      )
      dispatch(
        updateMessageStatus({
          receiverId: receiverId,
          messageId: message.id,
          newStatus: MessageStatus.READ,
        }),
      )
    }
    socketWrapper.emit(SocketEmitEvent.READ, readEventPayload)
  }, [receiverId, archivedChatList, authUser, dispatch, isSuccess, socketWrapper, unarchivedChatList, userMessagesMap])

  useEffect(() => {
    if (!isSuccess) return

    socketWrapper.on(SocketOnEvent.RECEIVE_MESSAGE, async payload => {
      const message: IMessage = {
        id: payload.messageId,
        content: payload.content,
        createdAt: payload.createdAt,
        senderId: payload.senderId,
        status: MessageStatus.DELIVERED,
      }
      const chatExists = !isNullOrUndefined(
        searchChat(unarchivedChatList, payload.senderId) || searchChat(archivedChatList, payload.senderId),
      )

      if (chatExists) {
        dispatch(unarchiveChat(payload.senderId))
        dispatch(
          updateChatListItemMessage({
            receiverId: payload.senderId,
            latestMsg: message,
          }),
        )
      } else {
        const convo = await dispatch(getChatByReceiverId(payload.senderId)).unwrap()
        convo.latestMsg = message
        dispatch(insertUnarchivedChat(convo))
      }

      socketWrapper.emit(SocketEmitEvent.DELIVERED, {
        messageId: message.id,
        receiverId: authUser.id,
        senderId: payload.senderId,
      })

      // No need to update status if the chat has never been fetched
      // Because they will arrive with proper data whenever fetched (updated on server)
      if (!userMessagesMap.has(payload.senderId)) return

      dispatch(
        upsertMessages({
          newMessages: [message],
          receiverId: payload.senderId,
        }),
      )
    })

    return () => {
      socketWrapper.off(SocketOnEvent.RECEIVE_MESSAGE)
    }
  }, [authUser, archivedChatList, dispatch, socketWrapper, unarchivedChatList, userMessagesMap, isSuccess])

  useEffect(() => {
    if (!isSuccess) return

    socketWrapper.on(SocketOnEvent.SENT, async payload => {
      const tempMessage = tempMessagesMap.get(payload.receiverId)!.get(payload.hash)!

      const message: IMessage = {
        id: payload.messageId,
        senderId: authUser.id,
        status: payload.status,
        content: tempMessage.content,
        createdAt: payload.createdAt,
      }

      const chatExists = !isNullOrUndefined(
        searchChat(unarchivedChatList, payload.receiverId) || searchChat(archivedChatList, payload.receiverId),
      )

      if (chatExists) {
        dispatch(
          updateChatListItemMessage({
            receiverId: payload.receiverId,
            latestMsg: message,
          }),
        )
      } else {
        const convo = await dispatch(getChatByReceiverId(payload.receiverId)).unwrap()
        convo.latestMsg = message
        dispatch(insertUnarchivedChat(convo))
      }

      // Temp message should be deleted after fetching the new convo
      // Otherwise there will be a delay for "sent" message to appear until the fetch is complete
      dispatch(
        deleteTempMessage({
          receiverId: payload.receiverId,
          hash: payload.hash,
        }),
      )
      dispatch(
        upsertMessages({
          newMessages: [message],
          receiverId: payload.receiverId,
        }),
      )
    })

    return () => {
      socketWrapper.off(SocketOnEvent.SENT)
    }
  }, [authUser, dispatch, isSuccess, socketWrapper, tempMessagesMap, archivedChatList, unarchivedChatList])

  useEffect(() => {
    socketWrapper.on(SocketOnEvent.DELIVERED, payload => {
      dispatch(
        updateChatListItemMessageStatus({
          messageId: payload.messageId,
          receiverId: payload.receiverId,
          latestMsgStatus: payload.status,
        }),
      )
      dispatch(
        updateMessageStatus({
          receiverId: payload.receiverId,
          messageId: payload.messageId,
          newStatus: payload.status,
        }),
      )
    })

    return () => {
      socketWrapper.off(SocketOnEvent.DELIVERED)
    }
  }, [dispatch, socketWrapper])

  useEffect(() => {
    socketWrapper.on(SocketOnEvent.READ, payloadArray => {
      payloadArray.forEach(p => {
        dispatch(
          updateChatListItemMessageStatus({
            messageId: p.messageId,
            receiverId: p.receiverId,
            latestMsgStatus: p.status,
          }),
        )
        dispatch(
          updateMessageStatus({
            receiverId: p.receiverId,
            messageId: p.messageId,
            newStatus: p.status,
          }),
        )
      })
    })

    return () => {
      socketWrapper.off(SocketOnEvent.READ)
    }
  }, [dispatch, socketWrapper])

  useEffect(() => {
    socketWrapper.on(SocketOnEvent.TYPING, payload => {
      dispatch(
        setTypingState({
          newState: payload.isTyping,
          receiverId: payload.senderId,
        }),
      )
    })

    return () => {
      socketWrapper.off(SocketOnEvent.TYPING)
    }
  }, [dispatch, socketWrapper])

  return { socketWrapper }
}

const SocketContext = createContext<ISocketContext | null>(null)

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socketWrapper } = useSocketInit()

  const contextValue = useMemo(() => ({ socket: socketWrapper }), [socketWrapper])

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>
}

export function useSocket() {
  return useContext(SocketContext)
}

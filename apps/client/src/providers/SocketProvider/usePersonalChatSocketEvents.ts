import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { useSocket } from '~/hooks/useSocket'
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
} from '~/store/features/messages/message-personal.slice'
import isUnread from '~/utils/isUnread'
import { setTypingState } from '~/store/features/typing/typing.slice'
import { useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import { MessageStatus, SocketEvents, type IMessage, type IReceiverEmitRead } from '@shared/types'
import type { IChatListItem, IUser } from '@shared/types/client'

function searchChat(chatList: IChatListItem[], receiverId: IUser['id']) {
  return chatList.find(item => item.receiver.id === receiverId) ?? null
}

export function usePersonalChatSocketEvents() {
  const dispatch = useAppDispatch()
  const { data: authUser, isSuccess } = useGetAuthUserQuery()
  const searchParams = useSearchParams()
  const receiverId = useMemo(() => (searchParams.has('to') ? parseInt(searchParams.get('to')!) : null), [searchParams])
  const archivedChatList = useAppSelector(selectArchived)
  const unarchivedChatList = useAppSelector(selectUnarchived)
  const userMessagesMap = useAppSelector(selectUserMessagesMap)
  const tempMessagesMap = useAppSelector(selectTempMessagesMap)

  const { socket } = useSocket()

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
    socket?.emit(SocketEvents.PERSONAL.STATUS_READ, readEventPayload)
  }, [receiverId, archivedChatList, authUser, dispatch, isSuccess, socket, unarchivedChatList, userMessagesMap])

  useEffect(() => {
    if (!isSuccess) return

    socket?.on(SocketEvents.PERSONAL.MESSAGE_RECEIVE, async payload => {
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

      socket?.emit(SocketEvents.PERSONAL.STATUS_DELIVERED, {
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
      socket?.off(SocketEvents.PERSONAL.MESSAGE_RECEIVE)
    }
  }, [authUser, archivedChatList, dispatch, socket, unarchivedChatList, userMessagesMap, isSuccess])

  useEffect(() => {
    if (!isSuccess) return

    socket?.on(SocketEvents.PERSONAL.STATUS_SENT, async payload => {
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
      socket?.off(SocketEvents.PERSONAL.STATUS_SENT)
    }
  }, [authUser, dispatch, isSuccess, socket, tempMessagesMap, archivedChatList, unarchivedChatList])

  useEffect(() => {
    socket?.on(SocketEvents.PERSONAL.STATUS_DELIVERED, payload => {
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
      socket?.off(SocketEvents.PERSONAL.STATUS_DELIVERED)
    }
  }, [dispatch, socket])

  useEffect(() => {
    socket?.on(SocketEvents.PERSONAL.STATUS_READ, payloadArray => {
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
      socket?.off(SocketEvents.PERSONAL.STATUS_READ)
    }
  }, [dispatch, socket])

  useEffect(() => {
    socket?.on(SocketEvents.PERSONAL.TYPING, payload => {
      dispatch(
        setTypingState({
          newState: payload.isTyping,
          receiverId: payload.senderId,
        }),
      )
    })

    return () => {
      socket?.off(SocketEvents.PERSONAL.TYPING)
    }
  }, [dispatch, socket])
}

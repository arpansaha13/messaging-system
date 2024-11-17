import { useEffect } from 'react'
import { MessageStatus, SocketEvents } from '@shared/constants'
import { useSocket } from '~/hooks/useSocket'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import {
  upsertGroupMessages,
  deleteTempGroupMessage,
  selectGroupMessagesMap,
  selectTempGroupMessagesMap,
} from '~/store/features/messages/message-group.slice'
import { invalidateTags as invalidateGroupsApiTags } from '~/store/features/groups/groups.api.slice'
import { GROUP_CHANNELS_API_TAG } from '~/store/features/constants'
import type { IGroupMessage } from '@shared/types'

export function useGroupChatSocketEvents() {
  const dispatch = useAppDispatch()
  // const params = useParams()
  const { data: authUser, isSuccess } = useGetAuthUserQuery()
  const groupMessagesMap = useAppSelector(selectGroupMessagesMap)
  const tempGroupMessagesMap = useAppSelector(selectTempGroupMessagesMap)
  // const channelId = useMemo(() => (params.channelId ? parseInt(params.channelId as string) : null), [params.channelId])

  const { socket } = useSocket()

  // useEffect(() => {
  //   if (isNullOrUndefined(channelId) || !isSuccess) return

  //   const messages = groupMessagesMap.get(channelId)

  //   if (isNullOrUndefined(messages)) return

  //   const readEventPayload: SocketEventPayloads.Group.EmitRead[] = []

  //   for (const message of messages.values()) {
  //     if (message.senderId === authUser.id || message.status === MessageStatus.READ) continue

  //     readEventPayload.push({
  //       messageId: message.id,
  //       receiverId: authUser.id,
  //     })

  //     dispatch(
  //       updateGroupMessageStatus({
  //         channelId,
  //         messageId: message.id,
  //         newStatus: MessageStatus.READ,
  //       }),
  //     )
  //   }
  //   if (readEventPayload.length > 0) socket?.emit(SocketEvents.GROUP.STATUS_READ, readEventPayload)
  // }, [authUser, channelId, dispatch, groupMessagesMap, isSuccess, socket])

  useEffect(() => {
    socket?.on(SocketEvents.GROUP.NEW_CHANNEL, payload => {
      console.log([{ type: GROUP_CHANNELS_API_TAG, id: payload.groupId }])
      dispatch(invalidateGroupsApiTags([{ type: GROUP_CHANNELS_API_TAG, id: payload.groupId }]))
    })

    return () => {
      socket?.off(SocketEvents.GROUP.NEW_CHANNEL)
    }
  }, [dispatch, socket])

  useEffect(() => {
    if (!isSuccess) return

    socket?.on(SocketEvents.GROUP.STATUS_SENT, async payload => {
      const tempMessage = tempGroupMessagesMap.get(payload.channelId)!.get(payload.hash)!

      const message: IGroupMessage = {
        id: payload.messageId,
        senderId: authUser.id,
        status: payload.status,
        channelId: payload.channelId,
        content: tempMessage.content,
        createdAt: payload.createdAt,
      }

      dispatch(
        deleteTempGroupMessage({
          channelId: payload.channelId,
          hash: payload.hash,
        }),
      )
      dispatch(
        upsertGroupMessages({
          newMessages: [message],
          channelId: payload.channelId,
        }),
      )
    })

    return () => {
      socket?.off(SocketEvents.GROUP.STATUS_SENT)
    }
  }, [authUser, dispatch, isSuccess, socket, tempGroupMessagesMap])

  useEffect(() => {
    if (!isSuccess) return

    socket?.on(SocketEvents.GROUP.MESSAGE_RECEIVE, async payload => {
      const message: IGroupMessage = {
        id: payload.messageId,
        content: payload.content,
        createdAt: payload.createdAt,
        senderId: payload.senderId,
        channelId: payload.channelId,
        status: MessageStatus.DELIVERED,
      }

      socket?.emit(SocketEvents.GROUP.STATUS_DELIVERED, {
        messageId: message.id,
        receiverId: authUser.id,
      })

      // No need to update status if the chat has never been fetched
      // Because they will arrive with proper data whenever fetched (updated on server)
      if (!groupMessagesMap.has(payload.channelId)) return

      dispatch(
        upsertGroupMessages({
          newMessages: [message],
          channelId: payload.channelId,
        }),
      )
    })

    return () => {
      socket?.off(SocketEvents.GROUP.MESSAGE_RECEIVE)
    }
  }, [authUser, dispatch, groupMessagesMap, isSuccess, socket])
}

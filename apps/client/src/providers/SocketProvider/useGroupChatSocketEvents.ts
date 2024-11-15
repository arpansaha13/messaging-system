import { useEffect } from 'react'
import { SocketEvents } from '@shared/constants'
import { useSocket } from '~/hooks/useSocket'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import {
  deleteTempGroupMessage,
  upsertGroupMessages,
  selectTempGroupMessagesMap,
} from '~/store/features/messages/message-group.slice'
import type { IGroupMessage } from '@shared/types'

export function useGroupChatSocketEvents() {
  const dispatch = useAppDispatch()
  const { data: authUser, isSuccess } = useGetAuthUserQuery()
  const tempGroupMessagesMap = useAppSelector(selectTempGroupMessagesMap)

  const { socket } = useSocket()

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
}

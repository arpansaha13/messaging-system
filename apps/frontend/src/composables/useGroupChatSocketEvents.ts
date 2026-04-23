import { MessageStatus, SocketEvents } from '~/constants'
import type { IGroupMessage, SocketEventPayloads, IUser } from '~/types'

import { useSocket } from './useSocket'

export function useGroupChatSocketEvents() {
  if (!import.meta.client) {
    return
  }

  const { data: authUser } = useNuxtData<IUser>('authUser')
  const socketState = useSocket()

  watchEffect(onCleanup => {
    const user = authUser.value
    if (!socketState.socket.ready.value || !user) {
      return
    }

    const handleMessageReceive = (payload: SocketEventPayloads['Group']['OnMessage']) => {
      const message: IGroupMessage = {
        id: payload.messageId,
        content: payload.content,
        createdAt: payload.createdAt,
        senderId: payload.senderId,
        channelId: payload.channelId,
        status: MessageStatus.DELIVERED,
      }

      const { data: messages } = useNuxtData<IGroupMessage[]>(asyncKeys.groupMessages(payload.channelId))
      if (!messages.value) {
        return
      }

      upsertGroupMessages(payload.channelId, [message])
    }

    socketState.socket.on(SocketEvents.GROUP.MESSAGE_RECEIVE, handleMessageReceive)

    onCleanup(() => {
      socketState.socket.off(SocketEvents.GROUP.MESSAGE_RECEIVE, handleMessageReceive)
    })
  })
}

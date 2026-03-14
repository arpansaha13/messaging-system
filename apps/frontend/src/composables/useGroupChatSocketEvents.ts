import { MessageStatus, SocketEvents } from '@shared/constants'
import type { IGroupMessage, SocketEventPayloads } from '@shared/types'

export async function useGroupChatSocketEvents() {
  if (!import.meta.client) {
    return
  }

  const { socket } = await useSocket()
  const { data: authUser } = await useFetchAuthUser()

  watchEffect(onCleanup => {
    const connection = socket.value
    const user = authUser.value
    if (!connection || !user) {
      return
    }

    const handleMessageReceive = (payload: SocketEventPayloads.Group.OnMessage) => {
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

    connection.on(SocketEvents.GROUP.MESSAGE_RECEIVE, handleMessageReceive)

    onCleanup(() => {
      connection.off(SocketEvents.GROUP.MESSAGE_RECEIVE, handleMessageReceive)
    })
  })
}

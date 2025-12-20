import { MessageStatus, SocketEvents } from '@shared/constants'
import type { IGroupMessage, SocketEventPayloads } from '@shared/types'

export async function useGroupChatSocketEvents() {
  if (!import.meta.client) {
    return
  }

  const { socket } = await useSocket()
  const { data: authUser } = await useFetchAuthUser()
  const groupMessages = useGroupMessagesState()

  watchEffect(onCleanup => {
    const connection = socket.value
    const user = authUser.value
    if (!connection || !user) {
      return
    }

    const handleNewChannel = () => {}

    const handleStatusSent = (payload: SocketEventPayloads.Group.OnSent) => {
      const tempMessage = groupMessages.getTempGroupMessage(payload.channelId, payload.hash)
      if (!tempMessage) {
        return
      }

      const message: IGroupMessage = {
        id: payload.messageId,
        senderId: user.id,
        status: payload.status,
        channelId: payload.channelId,
        content: tempMessage.content,
        createdAt: payload.createdAt,
      }

      groupMessages.deleteTempGroupMessage(payload.channelId, payload.hash)
      groupMessages.upsertGroupMessages(payload.channelId, [message])
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

      connection.emit(SocketEvents.GROUP.STATUS_DELIVERED, {
        messageId: message.id,
        receiverId: user.id,
      })

      if (!groupMessages.hasGroupMessages(payload.channelId)) {
        return
      }

      groupMessages.upsertGroupMessages(payload.channelId, [message])
    }

    connection.on(SocketEvents.GROUP.NEW_CHANNEL, handleNewChannel)
    connection.on(SocketEvents.GROUP.STATUS_SENT, handleStatusSent)
    connection.on(SocketEvents.GROUP.MESSAGE_RECEIVE, handleMessageReceive)

    onCleanup(() => {
      connection.off(SocketEvents.GROUP.NEW_CHANNEL, handleNewChannel)
      connection.off(SocketEvents.GROUP.STATUS_SENT, handleStatusSent)
      connection.off(SocketEvents.GROUP.MESSAGE_RECEIVE, handleMessageReceive)
    })
  })
}

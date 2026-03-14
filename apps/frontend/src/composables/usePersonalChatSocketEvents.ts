import { MessageStatus, SocketEvents } from '~/constants'
import type { IMessage, SocketEventPayloads, IUser  } from '~/types'
import { handleDelivered, handleRead } from '~/utils/mutations/messages'

export async function usePersonalChatSocketEvents() {
  if (!import.meta.client) {
    return
  }

  const route = useRoute()
  const { socket } = await useSocket()
  const { data: authUser } = await useFetchAuthUser()
  const { setTyping } = useTypingStore()

  const currentReceiverId = computed(() => {
    const to = route.query.to
    if (!to) return null
    return Number(Array.isArray(to) ? to[0] : to)
  })

  watchEffect(onCleanup => {
    const connection = socket.value
    const user = authUser.value
    if (!connection || !user) {
      return
    }

    const handleMessageReceive = async (payload: SocketEventPayloads.Personal.OnMessage) => {
      const message: IMessage = {
        id: payload.messageId,
        content: payload.content,
        createdAt: payload.createdAt,
        senderId: payload.senderId,
        status: MessageStatus.DELIVERED,
      }

      const chatExists = Boolean(findConversation(payload.senderId))
      if (!chatExists) {
        await initializeNewChat(payload.senderId)
      } else if (isConversationArchived(payload.senderId)) {
        await unarchiveChat(payload.senderId)
      }

      updateLatestMessageInChatList(payload.senderId, message)

      // Notify server that message was delivered via HTTP API
      try {
        await handleDelivered(message.id, user.id, payload.senderId)
      } catch (error) {
        console.error('Error sending delivered status:', error)
      }

      pushMessage(payload.senderId, message)
    }

    const handleStatusDelivered = (payload: SocketEventPayloads.Personal.OnDelivered) => {
      updateLatestMessageStatusInChatList(payload.receiverId, payload.messageId, payload.status)
      updateMessageStatus(payload.receiverId, payload.messageId, payload.status)
    }

    const handleStatusRead = (payloadArray: SocketEventPayloads.Personal.OnRead[]) => {
      payloadArray.forEach(p => {
        updateLatestMessageStatusInChatList(p.receiverId, p.messageId, p.status)
        updateMessageStatus(p.receiverId, p.messageId, p.status)
      })
    }

    const handleTyping = (payload: SocketEventPayloads.Personal.OnTyping) => {
      setTyping(payload.senderId, payload.isTyping)
    }

    connection.on(SocketEvents.PERSONAL.MESSAGE_RECEIVE, handleMessageReceive)
    connection.on(SocketEvents.PERSONAL.STATUS_DELIVERED, handleStatusDelivered)
    connection.on(SocketEvents.PERSONAL.STATUS_READ, handleStatusRead)
    connection.on(SocketEvents.PERSONAL.TYPING, handleTyping)

    onCleanup(() => {
      connection.off(SocketEvents.PERSONAL.MESSAGE_RECEIVE, handleMessageReceive)
      connection.off(SocketEvents.PERSONAL.STATUS_DELIVERED, handleStatusDelivered)
      connection.off(SocketEvents.PERSONAL.STATUS_READ, handleStatusRead)
      connection.off(SocketEvents.PERSONAL.TYPING, handleTyping)
    })
  })

  watchEffect(() => {
    const connection = socket.value
    const user = authUser.value
    const receiverId = currentReceiverId.value
    if (!connection || !user || !receiverId) {
      return
    }

    const conversation = findConversation(receiverId)
    if (!conversation?.latestMsg || !isUnread(user.id, conversation.latestMsg)) {
      return
    }

    const { data: messages } = useNuxtData<IMessage[]>(asyncKeys.messages(receiverId))
    if (!messages.value) return

    const payloads: SocketEventPayloads.Personal.EmitRead[] = []

    messages.value.forEach(message => {
      if (message.senderId === user.id || message.status === MessageStatus.READ) {
        return
      }

      payloads.push({
        messageId: message.id,
        senderId: receiverId,
        receiverId: user.id,
      })

      updateLatestMessageStatusInChatList(receiverId, message.id, MessageStatus.READ)
      updateMessageStatus(receiverId, message.id, MessageStatus.READ)
    })

    if (payloads.length > 0) {
      // Send read status via HTTP API
      handleRead(payloads).catch(error => {
        console.error('Error sending read status:', error)
      })
    }
  })
}

function findConversation(receiverId: number) {
  const unarchivedChats = getUnarchivedChatListData()
  const archivedChats = getArchivedChatListData()

  return (
    unarchivedChats.value?.find(item => item.receiver.id === receiverId) ??
    archivedChats.value?.find(item => item.receiver.id === receiverId) ??
    null
  )
}

function isConversationArchived(receiverId: number) {
  const archivedChats = getArchivedChatListData()
  if (!archivedChats.value) return false
  return archivedChats.value.some(item => item.receiver.id === receiverId)
}

function pushMessage(receiverId: IUser['id'], message: IMessage) {
  const { data: messages } = useNuxtData<IMessage[]>(asyncKeys.messages(receiverId))
  if (!messages.value) return

  messages.value.push(message)
}

function updateMessageStatus(
  receiverId: IUser['id'],
  messageId: IMessage['id'],
  newStatus: Exclude<MessageStatus, MessageStatus.SENDING>,
) {
  const { data: messages } = useNuxtData<IMessage[]>(asyncKeys.messages(receiverId))
  if (!messages.value) return

  for (let i = messages.value.length; i >= 0; i--) {
    if (messages.value[i]?.id === messageId) {
      messages.value[i] = {
        ...messages.value[i]!,
        status: newStatus,
      }
      break
    }
  }
}

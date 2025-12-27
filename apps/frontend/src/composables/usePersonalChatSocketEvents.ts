import { MessageStatus, SocketEvents } from '@shared/constants'
import type { IMessage, SocketEventPayloads } from '@shared/types'
import {
  initializeNewChat,
  unarchiveChat,
  getChatListData,
  updateLatestMessageStatusInChatList,
  updateLatestMessageInChatList,
} from '~/services/chats'
import type { IUser } from '~/types'

export async function usePersonalChatSocketEvents() {
  if (!import.meta.client) {
    return
  }

  const route = useRoute()
  const { socket } = await useSocket()
  const { data: authUser } = await useFetchAuthUser()
  const tempMessages = usePersonalMessagesState()
  const { setTyping } = useTypingState()

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

      connection.emit(SocketEvents.PERSONAL.STATUS_DELIVERED, {
        messageId: message.id,
        receiverId: user.id,
        senderId: payload.senderId,
      })

      pushMessage(payload.senderId, message)
    }

    const handleStatusSent = async (payload: SocketEventPayloads.Personal.OnSent) => {
      const tempMessage = tempMessages.getTempMessage(payload.receiverId, payload.hash)
      if (!tempMessage) return

      const message: IMessage = {
        id: payload.messageId,
        senderId: user.id,
        status: payload.status,
        content: tempMessage.content,
        createdAt: payload.createdAt,
      }

      const chatExists = Boolean(findConversation(payload.receiverId))
      if (!chatExists) {
        await initializeNewChat(payload.receiverId)
      }

      tempMessages.deleteTempMessage(payload.receiverId, tempMessage.hash)
      updateLatestMessageInChatList(payload.receiverId, message)
      pushMessage(payload.receiverId, message)
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
    connection.on(SocketEvents.PERSONAL.STATUS_SENT, handleStatusSent)
    connection.on(SocketEvents.PERSONAL.STATUS_DELIVERED, handleStatusDelivered)
    connection.on(SocketEvents.PERSONAL.STATUS_READ, handleStatusRead)
    connection.on(SocketEvents.PERSONAL.TYPING, handleTyping)

    onCleanup(() => {
      connection.off(SocketEvents.PERSONAL.MESSAGE_RECEIVE, handleMessageReceive)
      connection.off(SocketEvents.PERSONAL.STATUS_SENT, handleStatusSent)
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
      connection.emit(SocketEvents.PERSONAL.STATUS_READ, payloads)
    }
  })
}

function findConversation(receiverId: number) {
  const chatListData = getChatListData()
  if (!chatListData.value) return null

  return (
    chatListData.value.unarchived.find(item => item.receiver.id === receiverId) ??
    chatListData.value.archived.find(item => item.receiver.id === receiverId) ??
    null
  )
}

function isConversationArchived(receiverId: number) {
  const chatListData = getChatListData()
  if (!chatListData.value) return false
  return chatListData.value.archived.some(item => item.receiver.id === receiverId)
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

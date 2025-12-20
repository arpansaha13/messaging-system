<template>
  <ChatWindow v-if="receiver">
    <template #header>
      <ChatHeader
        :title="receiver.globalName"
        :avatar="receiver.dp ?? undefined"
        :subtitle="isTyping ? 'typing...' : undefined"
      />
    </template>

    <ChatBody
      v-if="!messagesLoading"
      :messages="messagesAsMap"
      :temp-messages="tempMessages"
      :auth-user-id="authUserId ?? 0"
    />

    <template #footer>
      <ChatFooter v-if="!messagesLoading" v-model:message="inputValue" @change="notifyTyping" @send="sendMessage" />
    </template>
  </ChatWindow>
</template>

<script setup lang="ts">
import type { IMessage, IMessageSending } from '@shared/types'
import { MessageStatus, SocketEvents } from '@shared/constants'
import { unarchiveChat } from '~/services/chats'

const route = useRoute()
const { data: authUser } = await useFetchAuthUser()
const { socket } = await useSocket()
const { getTyping } = useTypingState()
const draftsState = useDraftsState()
const personalMessages = usePersonalMessagesState()

// Get receiver ID from route query param
const receiverId = computed(() => {
  const to = route.query.to
  if (!to) return null
  return Number(Array.isArray(to) ? to[0] : to)
})

// Fetch receiver user data using useAsyncData with computed key
const { data: receiver } = await useFetchUser(receiverId)

// Fetch messages using useAsyncData
const { data: messagesData, pending: messagesLoading } = await useFetchPersonalMessages(receiverId)

// Convert fetched messages array to Map for ChatBody component
const messagesAsMap = computed(() => {
  if (!messagesData.value) return new Map<number, IMessage>()
  return new Map(messagesData.value.map((msg: IMessage) => [msg.id, msg]))
})

// Input state
const inputValue = ref('')
const prevReceiverId = ref<number | null>(null)
let typingTimeout: NodeJS.Timeout | null = null

// Computed properties
const authUserId = computed(() => authUser.value?.id)
const isTyping = computed(() => getTyping(receiverId.value ?? undefined) ?? false)

const tempMessages = computed(() => {
  if (!receiverId.value) return new Map<string, IMessageSending>()
  return personalMessages.getTempMessages(receiverId.value)
})

const notifyTyping = () => {
  // Clear existing typing timeout
  if (typingTimeout) clearTimeout(typingTimeout)

  // Emit typing event
  if (socket.value && receiverId.value && authUser.value) {
    socket.value.emit(SocketEvents.PERSONAL.TYPING, {
      senderId: authUser.value.id,
      receiverId: receiverId.value,
      isTyping: true,
    })

    // Stop typing after 1 second of inactivity
    typingTimeout = setTimeout(() => {
      if (socket.value && receiverId.value && authUser.value) {
        socket.value.emit(SocketEvents.PERSONAL.TYPING, {
          senderId: authUser.value.id,
          receiverId: receiverId.value,
          isTyping: false,
        })
      }
    }, 1000)
  }
}

// Send message function
const sendMessage = async (message: string) => {
  if (!message || !receiverId.value || !authUser.value) return

  try {
    // Unarchive chat if needed
    await unarchiveChat(receiverId.value)

    const newMessage: IMessageSending = {
      hash: generateHash(),
      content: message,
      senderId: authUser.value.id,
      status: MessageStatus.SENDING,
      createdInClientAt: new Date().toISOString(),
    }

    // Add temp message to UI
    personalMessages.upsertTempMessages(receiverId.value, [newMessage])

    // Clear input and typing state
    inputValue.value = ''
    if (typingTimeout) clearTimeout(typingTimeout)

    // Emit message via socket
    if (socket.value) {
      socket.value.emit(SocketEvents.PERSONAL.MESSAGE_SEND, {
        hash: newMessage.hash,
        content: newMessage.content,
        senderId: newMessage.senderId,
        status: newMessage.status,
        receiverId: receiverId.value,
      })
    }
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

// Manage draft messages when receiver changes
watchEffect(() => {
  const currentReceiverId = receiverId.value

  // Save draft from previous receiver
  if (prevReceiverId.value && inputValue.value) {
    draftsState.setDraft(prevReceiverId.value, inputValue.value)
    inputValue.value = ''
  }

  // Load draft for new receiver
  if (currentReceiverId) {
    const draft = draftsState.getDraft(currentReceiverId)
    if (draft) {
      inputValue.value = draft
      draftsState.removeDraft(currentReceiverId)
    }
  }

  prevReceiverId.value = currentReceiverId
})
</script>

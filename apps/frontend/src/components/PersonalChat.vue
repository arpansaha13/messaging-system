<template>
  <ChatWindow v-if="receiver" ref="chatWindowRef">
    <template #header>
      <ChatHeader
        :title="receiver.contact?.alias ?? receiver.globalName"
        :avatar="receiver.dp ?? undefined"
        :subtitle="isTyping ? 'typing...' : undefined"
        :online-status="onlineStatus"
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
import { sendPersonalMessage } from '~/utils/mutations/messages'

const route = useRoute()
const { data: authUser } = await useFetchAuthUser()
const { socket } = await useSocket()
const { getTyping } = useTypingStore()
const { getOnlineStatus } = useOnlineStatusStore()
const draftsState = useDraftsStore()
const personalMessages = usePersonalMessagesStore()

// Get receiver ID from route query param
const receiverId = computed(() => {
  const to = route.query.to
  if (!to) return null
  return Number(Array.isArray(to) ? to[0] : to)
})

// Fetch receiver user data using useAsyncData with computed key
const { data: receiver } = await useFetchUser(receiverId)

// Setup scroll element ref and computed
const chatWindowRef = useTemplateRef('chatWindowRef')
const scrollEl = computed(() => {
  if (!chatWindowRef.value) return null

  const el = chatWindowRef.value.$el as HTMLDivElement
  return el.children[1] as HTMLDivElement // UCard body
})

const { data: messagesData, pending: messagesLoading } = useFetchPersonalMessages(receiverId, scrollEl)

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
const onlineStatus = computed(() => getOnlineStatus(receiverId.value ?? undefined) ?? false)

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

    // Send message via HTTP API instead of socket
    await sendPersonalMessage(receiverId.value, newMessage.content, newMessage.hash)
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

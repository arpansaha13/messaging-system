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
import type { IMessage, IMessageSending } from '~/types'
import { MessageStatus, SocketEvents } from '~/constants'
import { sendPersonalMessage } from '~/utils/mutations/messages'

const route = useRoute()
const { data: authUser } = await useFetchAuthUser()
const socketState = useSocket()
const { getTyping } = useTypingStore()
const draftsState = useDraftsStore()
const personalMessages = usePersonalMessagesStore()
const logger = useLogger('PersonalChat')

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
let lastTypingEmit = 0

// Computed properties
const authUserId = computed(() => authUser.value?.id)
const isTyping = computed(() => getTyping(receiverId.value ?? undefined) ?? false)
const onlineStatus = computed(() => socketState.onlineStore.getOnlineStatus(receiverId.value ?? undefined) ?? false)

const tempMessages = computed(() => {
  if (!receiverId.value) return new Map<string, IMessageSending>()
  return personalMessages.getTempMessages(receiverId.value)
})

const notifyTyping = () => {
  if (socketState.socket.ready.value && receiverId.value && authUser.value) {
    const now = Date.now()
    const jitter = Math.random() * 1000 - 500 // -500 to +500 ms
    const interval = 5000 + jitter
    if (now - lastTypingEmit > interval) {
      lastTypingEmit = now
      socketState.socket.emit(SocketEvents.PERSONAL.TYPING, {
        senderId: authUser.value.id,
        receiverId: receiverId.value,
      })
    }
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
    lastTypingEmit = 0

    // Send message via HTTP API — 201 means message is persisted; replace temp with real IMessage
    const { hash, ...realMessage } = await sendPersonalMessage(receiverId.value, newMessage.content, newMessage.hash)
    personalMessages.deleteTempMessage(receiverId.value, newMessage.hash)
    updateLatestMessageInChatList(receiverId.value, realMessage)
    if (messagesData.value) {
      messagesData.value.push(realMessage)
    }
  } catch (error) {
    logger.error('Error sending message:', error)
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

// Cleanup on component unmount
onBeforeUnmount(() => {
  lastTypingEmit = 0
})
</script>

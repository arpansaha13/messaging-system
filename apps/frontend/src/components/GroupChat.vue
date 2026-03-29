<template>
  <ChatWindow v-if="channel" ref="chatWindowRef">
    <template #header>
      <ChatHeader :title="channel.name" />
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

  <!-- Empty State -->
  <div v-else-if="!channelLoading && !messagesLoading && !channel" class="flex h-full flex-col">
    <div class="flex h-full items-center justify-center text-gray-500">
      <p>Select a channel to start messaging</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IChannel, IGroupMessage, IGroupMessageSending  } from '~/types'
import { MessageStatus } from '~/constants'
import { sendGroupMessage } from '~/utils/mutations/messages'

const route = useRoute()
const { data: authUser } = await useFetchAuthUser()
const groupMessages = useGroupMessagesStore()

// Get channel ID from route params
const channelId = computed(() => {
  const id = route.params.channelId
  if (!id) return null
  let numId: number
  if (typeof id === 'string') {
    numId = Number(id)
  } else if (Array.isArray(id)) {
    numId = Number(id[0])
  } else {
    numId = Number(id)
  }
  return Number.isNaN(numId) ? null : numId
})

// Get group ID from route params
const groupId = computed(() => {
  const id = route.params.groupId
  if (!id) return null
  let numId: number
  if (typeof id === 'string') {
    numId = Number(id)
  } else if (Array.isArray(id)) {
    numId = Number(id[0])
  } else {
    numId = Number(id)
  }
  return Number.isNaN(numId) ? null : numId
})

// Fetch channel data
const { data: channel, pending: channelLoading } = await useAsyncData(
  () => `channel:${channelId.value}`,
  () => {
    if (!channelId.value) return Promise.resolve(null)
    return $fetch<IChannel>(`/api/channels/${channelId.value}`)
  },
)

// Input state
const inputValue = ref('')

// Computed properties
const authUserId = computed(() => authUser.value?.id)

const tempMessages = computed(() => {
  if (!channelId.value) return new Map<string, IGroupMessageSending>()
  return groupMessages.getTempGroupMessages(channelId.value as number)
})

// Setup scroll element ref and computed
const chatWindowRef = useTemplateRef('chatWindowRef')
const scrollEl = computed(() => {
  if (!chatWindowRef.value) return null

  const el = chatWindowRef.value.$el as HTMLDivElement
  return el.children[1] as HTMLDivElement // UCard body
})

const { data: messagesData, pending: messagesLoading } = useFetchGroupMessages(channelId, scrollEl)

// Convert fetched messages array to Map for ChatBody component
const messagesAsMap = computed(() => {
  if (!messagesData.value) return new Map<number, IGroupMessage>()
  return new Map(messagesData.value.map((msg: IGroupMessage) => [msg.id, msg]))
})

const notifyTyping = () => {
  // Note: Typing events for group chats not currently implemented
}

// Send message function
const sendMessage = async (message: string) => {
  if (!message || !channelId.value || !authUser.value || !groupId.value) return

  try {
    const newMessage: IGroupMessageSending = {
      hash: generateHash(),
      content: message,
      senderId: authUser.value.id,
      status: MessageStatus.SENDING,
      createdInClientAt: new Date().toISOString(),
      channelId: channelId.value as number,
    }

    // Add temp message to UI
    groupMessages.upsertTempGroupMessages(channelId.value as number, [newMessage])

    // Send message via HTTP API — 201 means message is persisted; replace temp with real IGroupMessage
    const realMessage = await sendGroupMessage(groupId.value, channelId.value, newMessage.content, newMessage.hash)
    groupMessages.deleteTempGroupMessage(channelId.value as number, newMessage.hash)
    upsertGroupMessages(channelId.value as number, [{
      id: realMessage.id,
      content: realMessage.content,
      senderId: realMessage.senderId,
      channelId: realMessage.channelId,
      createdAt: realMessage.createdAt,
      status: realMessage.status,
    }])
  } catch (error) {
    console.error('Error sending message:', error)
  }
}
</script>

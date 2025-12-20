<template>
  <ChatWindow v-if="channel">
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
import type { IChannel } from '~/types'
import { MessageStatus, SocketEvents } from '@shared/constants'
import type { IGroupMessage, IGroupMessageSending } from '@shared/types'

const route = useRoute()
const { socket } = await useSocket()
const { data: authUser } = await useFetchAuthUser()
const groupMessages = useGroupMessagesState()

// Initialize socket events
useGroupChatSocketEvents()

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
  `channel-${channelId.value}`,
  () => {
    if (!channelId.value) return Promise.resolve(null)
    return $fetch<IChannel>(`/api/channels/${channelId.value}`)
  },
  {
    watch: [channelId],
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

// Fetch messages using useAsyncData
const { data: messagesData, pending: messagesLoading } = await useFetchGroupMessages(channelId)

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

    // Emit message via socket
    if (socket.value) {
      socket.value.emit(SocketEvents.GROUP.MESSAGE_SEND, {
        hash: newMessage.hash,
        content: newMessage.content,
        senderId: newMessage.senderId,
        status: newMessage.status,
        channelId: channelId.value,
        groupId: groupId.value,
      })
    }
  } catch (error) {
    console.error('Error sending message:', error)
  }
}
</script>

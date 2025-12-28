<template>
  <UContextMenu :items="contextMenuItems">
    <div class="relative">
      <NuxtLink
        :to="{ query: { ...route.query, to: chatListItem.receiver.id } }"
        class="flex w-full items-center rounded px-3 py-3 text-left transition-colors"
        :class="linkClasses"
      >
        <UAvatar :src="receiver.dp || undefined" :alt="receiver.contact?.alias ?? receiver.globalName" size="md" />

        <div class="ml-4 w-full">
          <div class="flex items-center justify-between">
            <p class="text-base text-black dark:text-gray-50">
              <span v-if="receiver.contact?.alias">{{ receiver.contact.alias }}</span>
              <GlobalName v-else :name="receiver.globalName" />
            </p>
            <p
              v-if="latestMsg"
              class="flex items-end text-xs"
              :class="unread ? 'text-brand-600' : 'text-gray-500 dark:text-gray-400'"
            >
              <span>{{ formattedTimestamp }}</span>
            </p>
          </div>

          <div class="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <ChatListItemMessage :message="latestMsg" :is-sender="authUserIsSender" />

            <div v-if="showIconBox" class="flex shrink-0 items-center text-gray-500 dark:text-gray-400">
              <Icon v-if="chatListItem.chat.pinned" name="mdi:pin" />
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>
  </UContextMenu>
</template>

<script setup lang="ts">
import { differenceInCalendarDays, format } from 'date-fns'
import { classNames } from '@arpansaha13/utils'
import type { IChatListItem } from '~/types'
import type { ContextMenuItem } from '@nuxt/ui'
import { archiveChat, togglePinChat } from '~/services/chats'

const props = defineProps<{
  chatListItem: IChatListItem
}>()

const emit = defineEmits<{
  delete: [deleteTarget: IChatListItem]
}>()

const route = useRoute()
const { data: authUser } = await useFetchAuthUser()

const receiver = computed(() => props.chatListItem.receiver)
const latestMsg = computed(() => props.chatListItem.latestMsg)

const showIconBox = computed(() => {
  return props.chatListItem.chat.pinned
})

const receiverId = computed(() => {
  const query = route.query.to
  if (!query) {
    return null
  }
  return Number(Array.isArray(query) ? query[0] : query)
})

const authUserIsSender = computed(() => {
  if (!authUser.value || !latestMsg.value) {
    return false
  }
  return authUser.value.id === latestMsg.value.senderId
})

const unread = computed(() => {
  if (!authUser.value || !latestMsg.value) {
    return false
  }
  return isUnread(authUser.value.id, latestMsg.value)
})

const formattedTimestamp = computed(() => {
  if (!latestMsg.value) {
    return ''
  }
  return getDateTime(latestMsg.value.createdAt)
})

const linkClasses = computed(() =>
  classNames(
    'hover:bg-gray-200/80 dark:hover:bg-gray-600/40',
    receiverId.value === receiver.value.id &&
      'bg-gray-300/65 hover:bg-gray-400/40 dark:bg-gray-700/80 dark:hover:bg-gray-600/80',
    unread.value && 'font-semibold',
  ),
)

const contextMenuItems = computed<ContextMenuItem[]>(() => [
  [
    {
      label: props.chatListItem.chat.pinned ? 'Unpin chat' : 'Pin chat',
      onSelect: (e: Event) => {
        e.preventDefault()
        togglePinChat(props.chatListItem.receiver.id, !props.chatListItem.chat.pinned)
      },
    },
    {
      label: 'Archive chat',
      onSelect: (e: Event) => {
        e.preventDefault()
        archiveChat(props.chatListItem.receiver.id)
      },
    },
  ],
  [
    {
      label: 'Delete chat',
      color: 'error',
      onSelect: (e: Event) => {
        e.preventDefault()
        emit('delete', props.chatListItem)
      },
    },
  ],
])

function getDateTime(dateString: string) {
  const diff = differenceInCalendarDays(new Date(), new Date(dateString))
  if (diff < 1) return format(dateString, 'h:mm a')
  if (diff === 1) return 'Yesterday'
  return format(dateString, 'dd/MM/yy')
}
</script>

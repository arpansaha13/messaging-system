<template>
  <NuxtLayout name="window">
    <template #left>
      <UCard :ui="{ root: 'h-full', body: 'p-1.5 sm:p-1.5' }">
        <ul class="space-y-1">
          <ChatListItem
            v-for="chatListItem in chatList?.unarchived"
            :key="chatListItem.receiver.id"
            :chat-list-item="chatListItem"
            :menu-items="menuItems"
          >
            <Icon
              v-if="chatListItem.chat.pinned"
              icon="mdi:pin"
              class="text-gray-500 dark:text-gray-400"
              width="20"
              height="20"
            />
          </ChatListItem>
        </ul>

        <UModal v-model:open="deleteModalOpen" title="Delete chat">
          <template #body>
            <div class="mx-auto flex justify-center text-center">
              <Avatar
                :src="deleteTarget?.receiver.dp ?? null"
                :alt="deleteTarget ? `display picture of ${deleteTarget.receiver.globalName}` : ''"
                :size="6"
              />
            </div>

            <div class="mt-2">
              <p class="text-center text-sm font-medium text-gray-500 dark:text-gray-300">
                {{ deleteTarget?.receiver.contact?.alias ?? deleteTarget?.receiver.globalName ?? '' }}
              </p>
            </div>

            <p class="mt-2 text-center">
              Are you sure you want to delete this chat? The messages can no longer be recovered.
            </p>
          </template>

          <template #footer>
            <div class="w-full sm:flex sm:flex-row-reverse sm:gap-3">
              <UButton block color="error" :disabled="loading" @click="handleDelete"> Delete </UButton>
              <UButton block variant="outline" color="neutral" class="mt-3 sm:mt-0" @click="deleteModalOpen = false">
                Cancel
              </UButton>
            </div>
          </template>
        </UModal>
      </UCard>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { IChatListItem, IContextMenuItem } from '~/types'
import { togglePinChat, archiveChat } from '~/services/chats'

const { data: chatList } = useFetchChats()

const deleteModalOpen = ref(false)
const loading = ref(false)
const deleteTarget = ref<IChatListItem | null>(null)

const menuItems = computed<IContextMenuItem<IChatListItem>[]>(() => [
  {
    label: payload => (payload.chat.pinned ? 'Unpin chat' : 'Pin chat'),
    action: payload => {
      togglePinChat(payload.receiver.id, !payload.chat.pinned)
    },
  },
  {
    label: 'Archive chat',
    action: payload => {
      archiveChat(payload.receiver.id)
    },
  },
  // {
  //   label: 'Clear messages',
  //   action: payload => {
  //     deleteMessages(payload.receiver.id)
  //     clearLatestMessage(payload.receiver.id)
  //   },
  // },
  {
    label: 'Delete chat',
    action: payload => {
      deleteTarget.value = payload
      deleteModalOpen.value = true
    },
  },
])

async function handleDelete(_: Event) {
  // if (!deleteTarget.value) {
  //   return
  // }
  // const receiverId = deleteTarget.value.receiver.id
  // loading.value = true
  // try {
  //   await deleteMessages(receiverId)
  //   await deleteChatLocally(receiverId, false)
  //   await maybeClearActiveChat(receiverId)
  //   deleteTarget.value = null
  deleteModalOpen.value = false
  // } finally {
  //   loading.value = false
  // }
}

// async function maybeClearActiveChat(receiverId: number) {
//   const query = { ...route.query }
//   const currentId = query.to ? Number(Array.isArray(query.to) ? query.to[0] : query.to) : null

//   if (currentId === receiverId) {
//     delete query.to
//     await router.replace({ path: route.path, query })
//   }
// }
</script>

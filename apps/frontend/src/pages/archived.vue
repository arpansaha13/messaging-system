<template>
  <NuxtLayout name="window">
    <template #left>
      <UCard :ui="{ root: 'h-full', body: 'p-1.5 sm:p-1.5 overflow-y-auto' }">
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Archived</h2>
        </template>

        <div v-if="!archivedChats || archivedChats.length === 0" class="flex h-full items-center justify-center">
          <UEmpty
            icon="i-heroicons-archive-box"
            title="No archived chats"
            description="Your archived chats will appear here"
          />
        </div>

        <ul v-else class="space-y-1">
          <li v-for="chatListItem in archivedChats" :key="chatListItem.receiver.id">
            <ChatListItem
              :chat-list-item="chatListItem"
              :is-archived="true"
              @delete="handleDelete"
              @unarchive="handleUnarchive"
            />
          </li>
        </ul>
      </UCard>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import DeleteChatModal from '~/components/modal/DeleteChat.vue'
import type { IChatListItem } from '~/types'

const toast = useToast()
const overlay = useOverlay()
const deleteModal = overlay.create(DeleteChatModal)

const { data: chatList } = await useFetchChats()

const archivedChats = computed(() => {
  return chatList.value?.archived || []
})

async function handleDelete(deleteTarget: IChatListItem) {
  const instance = deleteModal.open({ deleteTarget })
  const result = await instance.result

  if (result.status === ModalStatus.CANCEL) return

  if (result.status === ModalStatus.SUCCESS) {
    maybeClearActiveChat(deleteTarget.receiver.id)
  } else {
    toast.add({
      title: 'Failed to delete chat',
      color: 'error',
    })
  }
}

function handleUnarchive(chatItem: IChatListItem) {
  try {
    unarchiveChat(chatItem.receiver.id)
  } catch {
    toast.add({
      title: 'Failed to restore chat',
      color: 'error',
    })
  }
}
</script>

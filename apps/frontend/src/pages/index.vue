<template>
  <NuxtLayout name="window">
    <template #left>
      <UCard :ui="{ root: 'h-full', body: 'p-1.5 sm:p-1.5 overflow-y-auto' }">
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
        </template>

        <ul v-if="chatList?.unarchived && chatList.unarchived.length > 0" class="space-y-1">
          <li v-for="chatListItem in chatList.unarchived" :key="chatListItem.receiver.id">
            <ChatListItem :chat-list-item="chatListItem" @delete="handleDelete" />
          </li>
        </ul>

        <UEmpty
          v-else
          icon="i-heroicons-envelope"
          title="No messages yet"
          description="Your messages will appear here"
        />
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

async function handleDelete(deleteTarget: IChatListItem) {
  const instance = deleteModal.open({ deleteTarget })
  const result = await instance.result

  if (result.status === ModalStatus.CANCEL) return

  if (result.status === ModalStatus.SUCCESS) {
    maybeClearActiveChat(deleteTarget.receiver.id)
  } else {
    toast.add({
      title: 'Failed to delete contact',
      color: 'error',
    })
  }
}
</script>

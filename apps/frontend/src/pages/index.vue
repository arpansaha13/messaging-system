<template>
  <NuxtLayout name="window">
    <template #left>
      <UCard :ui="{ root: 'h-full', body: 'p-1.5 sm:p-1.5' }">
        <ul class="space-y-1">
          <li>
            <ChatListItem
              v-for="chatListItem in chatList?.unarchived"
              :key="chatListItem.receiver.id"
              :chat-list-item="chatListItem"
              @delete="handleDelete"
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

const overlay = useOverlay()
const deleteModal = overlay.create(DeleteChatModal)

const { data: chatList } = await useFetchChats()

async function handleDelete(deleteTarget: IChatListItem) {
  const instance = deleteModal.open({ deleteTarget })
  const shouldDelete = await instance.result
  if (!shouldDelete) return

  const receiverId = deleteTarget.receiver.id

  // await deleteMessages(receiverId)
  await deleteChat(receiverId, false)
  await maybeClearActiveChat(receiverId)
}
</script>

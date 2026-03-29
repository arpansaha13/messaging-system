<template>
  <UModal title="Delete chat">
    <template #body>
      <div class="mx-auto flex justify-center text-center">
        <UAvatar
          :src="deleteTarget?.receiver.dp ?? undefined"
          :alt="deleteTarget?.receiver.contact?.alias ?? deleteTarget?.receiver.globalName"
          size="3xl"
        />
      </div>

      <div class="mt-2">
        <p class="text-center text-sm font-medium text-gray-500 dark:text-gray-300">
          {{ deleteTarget?.receiver.contact?.alias ?? deleteTarget?.receiver.globalName ?? '' }}
        </p>
      </div>

      <p class="mt-2 text-center text-sm text-balance">
        Are you sure you want to delete this chat? The messages can no longer be recovered.
      </p>
    </template>

    <template #footer>
      <div class="w-full sm:flex sm:flex-row-reverse sm:gap-3">
        <UButton block color="error" :loading="loading" data-testid="delete-chat-confirm" @click="handleDeleteChat"> Delete </UButton>
        <UButton block variant="outline" color="neutral" class="mt-3 sm:mt-0" data-testid="delete-chat-cancel" @click="cancel"> Cancel </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { IChatListItem } from '~/types'

const props = defineProps<{
  deleteTarget: IChatListItem
}>()

const emit = defineEmits<{ close: [{ status: ModalStatus; error?: Error }] }>()

const loading = ref(false)

function cancel() {
  emit('close', { status: ModalStatus.CANCEL })
}

async function handleDeleteChat() {
  loading.value = true

  try {
    await deleteChat(props.deleteTarget.receiver.id, false)
    emit('close', { status: ModalStatus.SUCCESS })
  } catch (error: any) {
    emit('close', { status: ModalStatus.FAILED, error })
  } finally {
    loading.value = false
  }
}
</script>

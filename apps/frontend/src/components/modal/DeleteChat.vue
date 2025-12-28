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
        <UButton block color="error" @click="emit('close', true)"> Delete </UButton>
        <UButton block variant="outline" color="neutral" class="mt-3 sm:mt-0" @click="emit('close', false)">
          Cancel
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { IChatListItem } from '~/types'

defineProps<{
  deleteTarget: IChatListItem
}>()

const emit = defineEmits<{ close: [boolean] }>()
</script>

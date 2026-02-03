<template>
  <div
    class="border-b border-gray-200 px-3 py-2 hover:bg-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
    :class="{ 'bg-blue-50 dark:bg-blue-900': isActive }"
  >
    <div class="flex items-center justify-between">
      <div class="min-w-0 flex-1">
        <h3 class="truncate text-sm font-medium dark:text-gray-100">{{ channel.name }}</h3>
      </div>
      <div class="ml-2 shrink-0">
        <UDropdown :items="contextMenu" :popper="{ placement: 'bottom-end' }">
          <UButton variant="ghost" size="xs" icon="i-heroicons-ellipsis-vertical-20-solid" @click.stop />
        </UDropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IChannel } from '~/types'

interface Props {
  channel: IChannel
  isActive?: boolean
}

withDefaults(defineProps<Props>(), {
  isActive: false,
})

const emit = defineEmits<{
  deleteChannel: []
  archiveChannel: []
}>()

const contextMenu = computed(() => [
  [
    {
      label: 'Archive',
      icon: 'i-heroicons-archive-box-20-solid',
      click: () => emit('archiveChannel'),
    },
    {
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      color: 'red',
      click: () => emit('deleteChannel'),
    },
  ],
])
</script>

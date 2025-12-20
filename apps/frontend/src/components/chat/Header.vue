<template>
  <div class="flex items-center gap-3">
    <div v-if="avatar" class="shrink-0">
      <UAvatar :src="avatar" :alt="title" size="md" />
    </div>

    <div class="flex flex-col">
      <h2 class="font-semibold text-gray-900 dark:text-gray-100">
        {{ title }}
      </h2>
      <p v-if="subtitle" class="text-xs text-gray-500 dark:text-gray-400">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="onlineStatus" class="ml-auto flex items-center gap-1">
      <span class="bg-success inline-block size-2 rounded-full" />
      <span class="text-xs text-gray-600 dark:text-gray-400">Online</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  avatar?: string
  onlineStatus?: boolean
}

defineProps<Props>()
</script>

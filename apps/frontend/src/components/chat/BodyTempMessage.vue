<script setup lang="ts">
import type { IMessageSending } from '@shared/types'
import { MessageStatus } from '@shared/constants'

interface Props {
  message: IMessageSending
}

defineProps<Props>()
</script>

<template>
  <div class="mb-4 ml-auto w-max" data-testid="temp-message-bubble">
    <div class="relative min-w-full space-y-1.5 rounded-lg border-b border-gray-400/50 p-2 text-sm text-gray-900 last:mb-0 bg-green-100 dark:bg-brand-800 dark:border-none dark:text-gray-100 lg:max-w-lg xl:max-w-xl">
      <p class="wrap-break-word">{{ message.content }}</p>
    </div>
    <div class="mt-0.5 flex justify-end">
      <p class="flex min-w-18 items-center gap-1 justify-end text-xs text-gray-500 dark:text-gray-400">
        <span v-if="message.status === MessageStatus.SENDING" class="inline-flex animate-spin">
          <UIcon name="i-lucide-loader-circle" class="size-3" />
        </span>
        <span v-else-if="message.status === MessageStatus.SENT">
          <UIcon name="i-lucide-check" class="size-4" />
        </span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IMessage } from '~/types'

defineProps<{
  message: IMessage
  authUserIsSender: boolean
}>()
</script>

<template>
  <div :class="['mb-4 w-max', authUserIsSender && 'ml-auto']" data-testid="message-bubble">
    <div
      :class="[
        'relative min-w-full space-y-1.5 rounded-lg border-b border-gray-400/50 p-2 text-sm text-gray-900 last:mb-0 lg:max-w-lg xl:max-w-xl dark:border-none dark:text-gray-100',
        authUserIsSender ? 'dark:bg-brand-800 bg-green-100' : 'bg-white dark:bg-slate-700',
      ]"
    >
      <p class="wrap-break-word">{{ message.content }}</p>
    </div>
    <div :class="['mt-0.5 flex', authUserIsSender && 'justify-end']">
      <p :class="['flex min-w-18 items-center gap-1', authUserIsSender && 'justify-end']">
        <FormattedDate :date-string="message.createdAt" />
        <span v-if="authUserIsSender" class="inline-flex size-4 shrink-0 items-center" data-testid="msg-status-icon" :data-status="message.status">
          <MsgStatusIcon :status="message.status" />
        </span>
      </p>
    </div>
  </div>
</template>

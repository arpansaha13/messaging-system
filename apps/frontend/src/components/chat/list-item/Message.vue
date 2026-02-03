<template>
  <p class="flex items-center space-x-1 text-sm" :class="message === null ? 'h-5' : ''">
    <MsgStatusIcon v-if="message && isSender" :status="message.status" />
    <span v-if="message" class="line-clamp-1">{{ message.content }}</span>
  </p>
</template>

<script setup lang="ts">
import type { IChatListItem } from '~/types'

defineProps<{
  message: IChatListItem['latestMsg']
  isSender: boolean
}>()
</script>

<template>
  <Icon v-if="iconName" :name="iconName" :style="{ color: iconColor }" />
</template>

<script setup lang="ts">
import { MessageStatus } from '@shared/constants'

const props = defineProps<{
  status: MessageStatus
}>()

const iconName = computed(() => {
  switch (props.status) {
    case MessageStatus.SENDING:
      return 'mdi:alarm'
    case MessageStatus.SENT:
      return 'mdi:check'
    case MessageStatus.DELIVERED:
    case MessageStatus.READ:
      return 'mdi:check-all'
    default:
      return null
  }
})

const iconColor = computed(() => {
  if (props.status === MessageStatus.READ) {
    return '#38bdf8'
  }
  return 'inherit'
})
</script>

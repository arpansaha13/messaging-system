<template>
  <slot />
</template>

<script setup lang="ts">
if (import.meta.client) {
  const { closeSocket } = await useSocket()
  usePersonalChatSocketEvents()
  useGroupChatSocketEvents()
  useGroupEventsSocketEvents()

  onBeforeUnmount(() => {
    closeSocket()
  })
}
</script>

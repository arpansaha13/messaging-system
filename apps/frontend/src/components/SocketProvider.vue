<template>
  <slot />
</template>

<script setup lang="ts">
if (import.meta.client) {
  const socketState = useSocket()
  const { data: authUser, refresh } = await useFetchAuthUser()

  onMounted(() => {
    watchEffect(() => {
      if (authUser.value) {
        socketState.socket.initialize(authUser.value.id, refresh)
        socketState.onlineStore.initialize()
      } else {
        socketState.socket.shutdown()
        socketState.onlineStore.shutdown()
      }
    })
  })

  usePersonalChatSocketEvents()
  useGroupChatSocketEvents()
  useGroupEventsSocketEvents()

  onBeforeUnmount(() => {
    socketState.onlineStore.shutdown()
    socketState.socket.shutdown()
  })
}
</script>

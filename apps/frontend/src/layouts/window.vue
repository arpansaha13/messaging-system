<template>
  <div class="flex h-full gap-2 p-2">
    <section class="flex h-full w-88 shrink-0 flex-col rounded shadow-md">
      <slot name="left" />
    </section>

    <section class="h-full grow overflow-hidden rounded shadow-md">
      <!-- Personal Chat -->
      <PersonalChat v-if="isPersonalChat" />

      <!-- Group Chat or Custom Body -->
      <slot v-else-if="$slots.body" name="body" />

      <div v-else class="flex h-full items-center justify-center text-gray-500">
        <p>Select a chat to start a conversation</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

// Check if we should show personal chat (when "to" query param exists)
const isPersonalChat = computed(() => {
  return !!route.query.to && !route.path.startsWith('/groups')
})
</script>

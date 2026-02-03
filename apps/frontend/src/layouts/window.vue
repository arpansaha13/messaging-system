<template>
  <div :class="['grid h-full gap-2 p-2', $slots.right ? 'grid-cols-4' : 'grid-cols-3']">
    <section class="flex h-full shrink-0 grow flex-col rounded shadow-md">
      <slot name="left" />
    </section>

    <section class="col-span-2 h-full grow overflow-hidden rounded shadow-md">
      <!-- Personal Chat -->
      <PersonalChat v-if="isPersonalChat" />

      <!-- Group Chat or Custom Body -->
      <slot v-else-if="$slots.body" name="body" />

      <div v-else class="flex h-full items-center justify-center text-gray-500">
        <p>Select a chat to start a conversation</p>
      </div>
    </section>

    <section v-if="$slots.right" class="flex h-full shrink-0 grow flex-col rounded shadow-md">
      <slot name="right" />
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

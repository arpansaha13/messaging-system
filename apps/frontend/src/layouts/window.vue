<template>
  <UPage :ui="{ root: ' p-2' }">
    <UPageBody class="mt-0 grid h-screen gap-2" :class="[$slots.right ? 'grid-cols-4' : 'grid-cols-3']">
      <!-- Left Sidebar -->
      <section class="h-full overflow-hidden rounded-lg shadow-md">
        <slot name="left" />
      </section>

      <!-- Main Content -->
      <section class="col-span-2 h-full overflow-hidden rounded-lg shadow-md">
        <!-- Personal Chat -->
        <PersonalChat v-if="isPersonalChat" />

        <!-- Group Chat or Custom Body -->
        <slot v-else-if="$slots.body" name="body" />

        <!-- Empty State -->
        <div v-else class="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
          <p>Select a chat to start a conversation</p>
        </div>
      </section>

      <!-- Right Sidebar (Optional) -->
      <section v-if="$slots.right" class="h-full overflow-hidden rounded-lg shadow-md">
        <slot name="right" />
      </section>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
const route = useRoute()

// Check if we should show personal chat (when "to" query param exists)
const isPersonalChat = computed(() => {
  return !!route.query.to && !route.path.startsWith('/groups')
})
</script>

<template>
  <NuxtLayout name="group">
    <template #body>
      <!-- Empty state for group overview -->
      <div class="flex h-full items-center justify-center">
        <div class="text-center">
          <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">{{ group?.name || 'Group' }}</p>
          <p class="mt-2 text-sm text-gray-500">Select a channel to start chatting</p>
        </div>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
const route = useRoute()
const { data: groups } = await useFetchGroups()

const groupId = computed(() => {
  const id = route.params.groupId
  let numId: number
  if (typeof id === 'string') {
    numId = Number(id)
  } else if (Array.isArray(id) && id.length > 0) {
    numId = Number(id[0])
  } else {
    numId = 0
  }
  return Number.isNaN(numId) ? 0 : numId
})

const group = computed(() => {
  return groups.value?.find((g: any) => g.id === groupId.value) || null
})
</script>

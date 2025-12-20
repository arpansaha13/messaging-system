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
import type { IChannel } from '~/types'

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

// Form state
const channelFormData = reactive({
  name: '',
})

const isCreatingChannel = ref(false)
const isCreateChannelModalOpen = ref(false)

// Create new channel
const handleCreateChannel = async () => {
  if (!channelFormData.name.trim() || !groupId.value) return

  isCreatingChannel.value = true
  try {
    const response = await $fetch<IChannel>(`/api/groups/${groupId.value}/channels`, {
      method: 'POST',
      body: {
        name: channelFormData.name.trim(),
      },
    })

    // Reset form
    channelFormData.name = ''

    // Close modal
    isCreateChannelModalOpen.value = false

    // Optionally navigate to the new channel
    if (response?.id) {
      await navigateTo(`/groups/${groupId.value}/${response.id}`)
    }
  } catch (error) {
    console.error('Error creating channel:', error)
  } finally {
    isCreatingChannel.value = false
  }
}
</script>

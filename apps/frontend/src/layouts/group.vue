<template>
  <NuxtLayout name="window">
    <template #left>
      <!-- Channel List Header -->
      <UCard :ui="{ root: 'h-full flex flex-col', body: 'grow p-0 sm:p-0 overflow-auto' }">
        <template #header>
          <div class="flex justify-between">
            <UAvatar :alt="group?.name" size="3xl" class="shadow-md" />

            <div class="flex items-center gap-2">
              <UModal title="Create channel" :description="`Create a new channel in ${group?.name}`">
                <UButton square size="sm" variant="ghost">
                  <span class="sr-only">Create new channel</span>
                  <Icon name="i-heroicons-plus-solid" size="1.25rem" />
                </UButton>

                <template #body>
                  <UFormField label="Channel Name" required>
                    <UInput
                      id="channel-name"
                      v-model="channelFormData.name"
                      type="text"
                      placeholder="Enter channel name"
                      class="mt-1 w-full"
                      :disabled="isCreatingChannel"
                      required
                    />
                  </UFormField>
                </template>

                <template #footer="{ close }">
                  <div class="flex w-full gap-3">
                    <UButton block variant="outline" color="neutral" @click="close"> Cancel </UButton>
                    <UButton block :loading="isCreatingChannel" @click="handleCreateChannel(close)">
                      Create Channel
                    </UButton>
                  </div>
                </template>
              </UModal>

              <UButton square size="sm" variant="ghost" @click="toggleMembersPanel">
                <span class="sr-only">View group members</span>
                <Icon name="i-heroicons-user-group-solid" size="1.25rem" />
              </UButton>
            </div>
          </div>

          <h2 class="mt-3 text-lg font-semibold dark:text-gray-100">{{ group?.name ?? 'Group' }}</h2>
        </template>

        <div>
          <!-- Empty State -->
          <div v-if="!channels || channels.length === 0" class="p-4 text-center text-sm text-gray-500">
            <p>No channels yet</p>
            <p class="mt-1 text-xs">Create a channel to start chatting</p>
          </div>

          <!-- Channels List -->
          <template v-else>
            <NuxtLink
              v-for="channel in channels"
              :key="channel.id"
              :to="`/groups/${groupId}/${channel.id}`"
              class="block border-b border-gray-200 px-4 py-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              active-class="bg-blue-50 dark:bg-blue-900/20"
            >
              <p class="font-medium text-gray-700 dark:text-gray-300">{{ channel.name }}</p>
            </NuxtLink>
          </template>
        </div>
      </UCard>
    </template>

    <template #body>
      <slot name="body" />
    </template>

    <template v-if="showRightPanel" #right>
      <UCard :ui="{ root: 'h-full flex flex-col', body: 'grow p-0 sm:p-0 overflow-auto' }">
        <!-- Loading State -->
        <div v-if="pending" class="space-y-3 p-4">
          <div v-for="i in 3" :key="i" class="flex items-center gap-3">
            <USkeleton class="h-10 w-10 rounded-full" />
            <div class="flex-1">
              <USkeleton class="h-4 w-full" />
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex items-center justify-center p-4 text-center text-sm text-red-500">
          <p>Failed to load members</p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!members || members.length === 0"
          class="flex items-center justify-center p-4 text-center text-sm text-gray-500"
        >
          <p>No members yet</p>
        </div>

        <!-- Members List -->
        <template v-else>
          <div class="space-y-2 p-4">
            <div
              v-for="member in members"
              :key="member.id"
              class="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <UAvatar :alt="member.user?.globalName" size="md" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ member.user?.globalName || 'Unknown' }}
                </p>
                <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                  {{ member.role }}
                </p>
              </div>
            </div>
          </div>
        </template>
      </UCard>
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
  return groups.value?.find(g => g.id === groupId.value) || null
})

const { data: members, pending, error } = useFetchGroupMembers(groupId)

// Fetch channels for the group
const { data: channels } = await useFetchGroupChannels(groupId)

// Form state
const channelFormData = reactive({
  name: '',
})

const isCreatingChannel = ref(false)
const showRightPanel = ref(false)

async function toggleMembersPanel() {
  showRightPanel.value = !showRightPanel.value
}

async function handleCreateChannel(closeModal: () => void) {
  if (!channelFormData.name.trim() || !groupId.value) return

  isCreatingChannel.value = true
  try {
    const response = await createChannel(groupId.value, {
      name: channelFormData.name.trim(),
    })

    channelFormData.name = ''
    closeModal()

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

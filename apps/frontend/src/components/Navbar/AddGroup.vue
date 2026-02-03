<template>
  <div>
    <UModal title="Create new group">
      <UButton square variant="soft">
        <span class="sr-only">Create new group</span>
        <Icon name="i-heroicons-plus-solid" size="1.25rem" />
      </UButton>

      <template #body>
        <UFormField required label="Choose a name for your group">
          <UInput id="group-name" v-model="groupName" autocomplete="off" required class="w-full" />
        </UFormField>
      </template>

      <template #footer="{ close }">
        <div class="flex w-full gap-3">
          <UButton block variant="outline" color="neutral" @click="close"> Cancel </UButton>

          <UButton block class="sm:col-start-2" :loading="loading" @click="handleCreateGroup(close)"> Create </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const groupName = ref('')
const loading = ref(false)

async function handleCreateGroup(closeModal: () => void) {
  if (!groupName.value.trim()) {
    return
  }

  loading.value = true
  try {
    await createGroup({ name: groupName.value.trim() })
    groupName.value = ''
    closeModal()
  } finally {
    loading.value = false
  }
}
</script>

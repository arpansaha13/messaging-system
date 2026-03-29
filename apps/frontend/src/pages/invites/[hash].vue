<template>
  <section class="flex h-full items-center justify-center px-4">
    <div class="w-full max-w-sm space-y-4 text-center">
      <p v-if="pending" class="text-sm text-gray-500">Loading invite...</p>
      <p v-else-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>
      <template v-else>
        <p class="text-sm text-gray-500">Invite hash: {{ hash }}</p>
        <UButton :loading="isAccepting" block @click="handleAccept">Accept invite</UButton>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { acceptInvite, fetchInvite } from '~/utils/mutations/invites'
import { asyncKeys } from '~/utils/asyncKeys'

const route = useRoute()

const hash = computed(() => {
  const param = route.params.hash
  if (typeof param === 'string') return param
  if (Array.isArray(param) && param.length > 0) return param[0]
  return ''
})

const { data: invite, pending, error } = await useAsyncData(
  () => (hash.value ? asyncKeys.inviteByHash(hash.value) : `${asyncKeys.inviteByHash('')}:empty`),
  () => (hash.value ? fetchInvite(hash.value) : Promise.resolve(null)),
  {
    watch: [hash],
    default: () => null,
  },
)

const isAccepting = ref(false)
const acceptError = ref<string | null>(null)

const errorMessage = computed(() => {
  if (acceptError.value) return acceptError.value
  if (!hash.value) return 'Invite hash is missing.'
  if (error.value || !invite.value) return 'Invite is invalid or expired.'
  return null
})

async function handleAccept() {
  if (!hash.value) return
  acceptError.value = null
  isAccepting.value = true
  try {
    const result = await acceptInvite(hash.value)
    await refreshNuxtData(asyncKeys.groups)
    await navigateTo(`/groups/${result.groupId}`)
  } catch (err) {
    console.error('Failed to accept invite:', err)
    acceptError.value = 'Invite is invalid or expired.'
  } finally {
    isAccepting.value = false
  }
}
</script>


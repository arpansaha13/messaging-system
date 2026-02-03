<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <div class="space-y-4 text-center">
        <UIcon name="i-lucide-info" class="text-info mx-auto size-12" />
        <h2 class="text-2xl font-semibold">Verification Pending</h2>
        <p class="text-muted">
          Your verification is pending. Please check your email for the verification instructions or try logging in.
        </p>
        <div class="flex gap-3 pt-4">
          <UButton variant="outline" to="/auth/login" class="flex-1">Login</UButton>
          <UButton to="/auth/signup" class="flex-1">Sign up</UButton>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})
</script>

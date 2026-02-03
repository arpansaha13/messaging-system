<template>
  <UApp :toaster="{ position: 'top-right' }">
    <NuxtLayout>
      <NuxtLoadingIndicator color="#10b981" />
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: title => (title ? `${title} • Messaging System` : 'Messaging System'),
})
</script>

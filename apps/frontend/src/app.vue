<template>
  <UApp>
    <NuxtLayout>
      <NuxtLoadingIndicator color="repeating-linear-gradient(to right,#00dc82 0%,#34cdfe 50%,#0047e1 100%)" />
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: titleChunk => {
    return titleChunk ? `${titleChunk} - Nuxt Template` : 'Nuxt Template'
  },
})
</script>

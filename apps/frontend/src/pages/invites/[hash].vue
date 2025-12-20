<template>
  <section class="flex h-full items-center justify-center px-4">
    <p class="text-sm text-gray-500">Invite hash: {{ route.params.hash }}</p>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
</script>


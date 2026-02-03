<template>
  <span class="italic">~{{ name }}</span>
</template>

<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>


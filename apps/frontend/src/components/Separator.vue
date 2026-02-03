<template>
  <div :class="['my-1 h-px w-full bg-gray-950/10 dark:bg-gray-50/10', props.class]" />
</template>

<script setup lang="ts">
const props = defineProps<{
  class?: string
}>()
</script>



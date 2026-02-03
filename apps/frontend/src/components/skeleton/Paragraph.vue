<template>
  <div :class="['animate-pulse rounded bg-gray-200 dark:bg-gray-700', props.class]" />
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    class?: string
  }>(),
  {
    class: '',
  },
)
</script>

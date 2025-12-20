<template>
  <div class="flex-shrink-0" :class="pulse ? 'animate-pulse' : ''" :style="{ width: dimension, height: dimension }">
    <AvatarSvg
      :size="props.size"
      bg-color="bg-gray-500 dark:bg-gray-600"
      svg-color="text-gray-300 dark:text-gray-400"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: number
    pulse?: boolean
  }>(),
  {
    size: 2,
    pulse: false,
  },
)

const dimension = computed(() => `${props.size}rem`)
</script>

<template>
  <div class="relative overflow-hidden rounded-full" :style="{ width: `${size}rem`, height: `${size}rem` }">
    <img v-if="hasImage" :src="src || ''" :alt="alt" class="size-full rounded-full object-cover" />
    <AvatarSvg
      v-else
      :size="size"
      bg-color="bg-gray-500 dark:bg-gray-500"
      svg-color="text-gray-300 dark:text-gray-300"
    />
  </div>
</template>

<script setup lang="ts">
import AvatarSvg from './AvatarSvg.vue'

const props = defineProps<{
  src?: string | null
  alt?: string
  size: number
}>()

const hasImage = computed(() => Boolean(props.src))
</script>

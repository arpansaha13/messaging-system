<template>
  <div
    class="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-500"
    :style="{ width: `${size}rem`, height: `${size}rem` }"
  >
    <template v-if="src">
      <img :src="src" :alt="alt" class="size-full rounded-full object-cover">
    </template>
    <template v-else>
      <UserGroupIcon class="size-3/4 text-gray-200" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { UserGroupIcon } from '@heroicons/vue/24/solid'

withDefaults(
  defineProps<{
    src?: string | null
    alt?: string
    size?: number
  }>(),
  {
    src: null,
    alt: '',
    size: 4,
  },
)
</script>



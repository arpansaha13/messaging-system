<template>
  <ul class="animate-pulse space-y-0.5">
    <li v-for="item in placeholders" :key="item" class="mx-auto flex size-10 items-center justify-center rounded">
      <UserGroupIcon class="size-6 text-gray-300 dark:text-gray-500" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { UserGroupIcon } from '@heroicons/vue/24/solid'

const placeholders = Array.from({ length: 5 }, (_, i) => i)
</script>


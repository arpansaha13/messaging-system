<template>
  <div class="animate-pulse space-y-1">
    <div v-for="item in placeholders" :key="item">
      <div class="flex w-full items-center rounded px-3">
        <SkeletonAvatar :size="3" />

        <div class="ml-4 w-full py-3">
          <div class="flex items-center justify-between">
            <div class="h-6 w-20 py-0.5">
              <SkeletonParagraph class="inline-block size-full" />
            </div>
            <div class="h-4 w-12">
              <SkeletonParagraph class="inline-block size-full" />
            </div>
          </div>
          <div class="flex h-5 justify-between">
            <div class="w-4/5 py-0.5">
              <SkeletonParagraph class="inline-block size-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const placeholders = Array.from({ length: 5 }, (_, i) => i)
</script>

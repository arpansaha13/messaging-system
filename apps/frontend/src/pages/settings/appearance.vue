<template>
  <NuxtLayout name="settings">
    <UCard variant="outline" :ui="{ root: 'h-full flex flex-col', body: 'grow' }">
      <template #header>
        <h1 class="text-xl font-bold">Appearance</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Choose how you'd like the interface to appear</p>
      </template>

      <UAlert variant="subtle" color="warning" title="Theme switching is disabled" />

      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          v-for="option in themeOptions"
          :key="option.value"
          class="flex cursor-pointer items-center rounded-lg border-2 p-4 transition-all"
          :class="[
            isActive(option.value)
              ? 'border-primary bg-gray-50 dark:bg-transparent'
              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
          ]"
          @click="colorMode.preference = option.value"
        >
          <div class="shrink-0">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg" :class="option.iconBg">
              <UIcon :name="option.icon" class="h-6 w-6" />
            </div>
          </div>
          <div class="ml-4 flex-1">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ option.label }}</h3>
            <p class="text-sm text-gray-500">{{ option.description }}</p>
          </div>
          <div v-if="isActive(option.value)" class="shrink-0">
            <UIcon name="i-heroicons-check-circle" class="text-brand-500 h-6 w-6" />
          </div>
        </div>
      </div>
    </UCard>
  </NuxtLayout>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

const themeOptions = [
  {
    value: 'light',
    label: 'Light',
    description: 'Clean and bright interface',
    icon: 'i-heroicons-sun',
    iconBg: 'bg-yellow-100 text-yellow-600',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Comfortable for low-light environments',
    icon: 'i-heroicons-moon',
    iconBg: 'bg-slate-700 text-slate-300',
  },
  {
    value: 'system',
    label: 'System',
    description: 'Use device settings',
    icon: 'i-heroicons-computer-desktop',
    iconBg: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  },
] as const

function isActive(value: string) {
  return value === 'system' ? colorMode.preference === 'system' : colorMode.value === value
}
</script>

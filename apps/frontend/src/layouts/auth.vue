<template>
  <UPage
    :ui="{
      root: 'items-center min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800',
    }"
    class=""
  >
    <UPageBody class="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div class="w-full max-w-md">
        <slot />
      </div>
    </UPageBody>
  </UPage>
</template>

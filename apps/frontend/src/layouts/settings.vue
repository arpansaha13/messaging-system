<template>
  <UPage :ui="{ root: ' p-2' }">
    <!-- Sidebar Navigation -->
    <template #left>
      <UPageCard variant="ghost">
        <UNavigationMenu :items="navigationItems" orientation="vertical" highlight class="px-1 py-2" />
      </UPageCard>
    </template>

    <!-- Main Content -->
    <UPageBody class="mt-0">
      <main>
        <slot />
      </main>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const logger = useLogger('settings_layout')

const navigationItems = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: 'Profile',
      to: '/settings/profile',
      active: route.path === '/settings/profile',
    },
    {
      label: 'Appearance',
      to: '/settings/appearance',
      active: route.path === '/settings/appearance',
    },
  ],
  [
    {
      label: 'Log out',
      async onSelect() {
        try {
          await logout()
          await navigateTo('/')
        } catch (error: any) {
          logger.error('Logout failed:', error)
        }
      },
    },
  ],
])
</script>

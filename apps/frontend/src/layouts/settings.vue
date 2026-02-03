<template>
  <div class="mx-auto flex h-full max-w-6xl gap-2 py-4">
    <section class="w-60 shrink-0 space-y-4 rounded">
      <UNavigationMenu :items="navigationItems" orientation="vertical" highlight class="px-3 py-4" />
    </section>

    <section class="h-full grow overflow-auto">
      <slot />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

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
          console.error('Logout failed:', error)
        }
      },
    },
  ],
])
</script>

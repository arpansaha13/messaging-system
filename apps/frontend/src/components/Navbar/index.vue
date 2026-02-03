<template>
  <nav class="flex h-full w-16 shrink-0 flex-col items-center gap-0.5 bg-gray-100 py-4 shadow-md dark:bg-gray-900">
    <template v-for="(navItem, index) in navItems" :key="index">
      <Separator v-if="navItem.type === 'separator'" class="w-4/5" />

      <template v-else-if="navItem.type === 'groups'">
        <div ref="groupListContainer" class="scrollbar w-full grow overflow-y-auto">
          <template v-if="groupsPending">
            <SkeletonNavbarGroupList />
          </template>
          <template v-else>
            <ul class="space-y-0.5">
              <li
                v-for="group in groups"
                :key="group.id"
                class="group relative w-full"
                :class="isOverflowingY ? 'pl-scrollbar' : ''"
              >
                <NuxtLink
                  :to="`/groups/${group.id}`"
                  class="mx-auto flex size-10 items-center justify-center rounded transition-colors"
                  :class="isActiveGroup(group.id) ? activeClasses : ''"
                >
                  <UserGroupIcon class="size-6 shrink-0" />
                  <span class="sr-only">{{ group.name }}</span>
                </NuxtLink>
                <span
                  class="pointer-events-none absolute top-1/2 left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors group-hover:bg-gray-900 dark:group-hover:bg-gray-100"
                />
              </li>
            </ul>
          </template>

          <div class="mx-auto mt-0.5 w-max" :class="isOverflowingY ? 'pl-scrollbar' : ''">
            <NavbarAddGroup />
          </div>
        </div>
      </template>

      <div v-else class="group relative w-full">
        <NuxtLink
          :to="buildLink(navItem)"
          class="mx-auto block w-max rounded p-2 transition-colors"
          :class="isNavActive(navItem.to) ? activeClasses : ''"
        >
          <span class="sr-only">{{ navItem.name }}</span>
          <component :is="navItem.icon" class="size-6 shrink-0" />
        </NuxtLink>
        <span
          class="pointer-events-none absolute top-1/2 left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors group-hover:bg-gray-900 dark:group-hover:bg-gray-100"
        />
      </div>
    </template>

    <div class="group relative mt-4 w-full">
      <NuxtLink to="/settings/profile" class="mx-auto block w-max rounded p-2 transition-colors">
        <template v-if="authUserPending">
          <SkeletonAvatar :size="2" pulse />
        </template>
        <template v-else-if="authUser">
          <UAvatar :src="authUser.dp ?? undefined" :alt="authUser.globalName" size="md" :ui="{ root: 'shadow-md' }" />
        </template>
        <span class="sr-only">Profile</span>
      </NuxtLink>
      <span
        class="pointer-events-none absolute top-1/2 left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors group-hover:bg-gray-900 dark:group-hover:bg-gray-100"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
import {
  ArchiveBoxIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline'
import { UserGroupIcon } from '@heroicons/vue/24/solid'

interface NavLinkItem {
  type: 'link'
  to: string
  name: string
  icon: Component
  preserveQuery: boolean
}

type NavItem = NavLinkItem | { type: 'separator' } | { type: 'groups' }

const navItems: NavItem[] = [
  {
    type: 'link',
    to: '/',
    name: 'Chats',
    icon: ChatBubbleOvalLeftEllipsisIcon,
    preserveQuery: true,
  },
  {
    type: 'link',
    to: '/contacts',
    name: 'Contacts',
    icon: UsersIcon,
    preserveQuery: true,
  },
  {
    type: 'link',
    to: '/search',
    name: 'Search',
    icon: MagnifyingGlassIcon,
    preserveQuery: true,
  },
  { type: 'separator' },
  { type: 'groups' },
  { type: 'separator' },
  {
    type: 'link',
    to: '/archived',
    name: 'Archived',
    icon: ArchiveBoxIcon,
    preserveQuery: true,
  },
  {
    type: 'link',
    to: '/settings/profile',
    name: 'Settings',
    icon: Cog6ToothIcon,
    preserveQuery: false,
  },
]

const activeClasses = 'bg-brand-300 text-brand-900 dark:bg-brand-800 dark:text-brand-200'

const route = useRoute()

const { data: authUser, pending: authPending } = await useFetchAuthUser()
const authUserPending = computed(() => authPending.value)

const { data: groups, pending: groupsPending } = await useFetchGroups()

const groupListContainer = ref<HTMLElement | null>(null)
const { isOverflowingY } = useOverflow(groupListContainer)

function buildLink(navItem: NavLinkItem) {
  if (navItem.preserveQuery) {
    return {
      path: navItem.to,
      query: route.query,
    }
  }
  return navItem.to
}

function isNavActive(path: string) {
  return route.path === path
}

function isActiveGroup(groupId: number) {
  return route.path.startsWith(`/groups/${groupId}`)
}
</script>

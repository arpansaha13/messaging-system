<template>
  <Transition
    enter-active-class="transition ease-out duration-100"
    enter-from-class="transform opacity-0 scale-95"
    enter-to-class="transform opacity-100 scale-100"
    leave-active-class="transition ease-in duration-75"
    leave-from-class="transform opacity-100 scale-100"
    leave-to-class="transform opacity-0 scale-95"
  >
    <div
      v-if="context?.open.value"
      class="absolute z-10 w-48 origin-top rounded-md bg-gray-50 text-gray-800 shadow-md focus:outline-none dark:bg-gray-800 dark:text-gray-100 dark:shadow-black/70"
      :style="{ top: `${context?.position.value.top}px`, left: `${context?.position.value.left}px` }"
    >
      <div class="px-0.5 py-1.5">
        <button
          v-for="(item, index) in items"
          :key="index"
          type="button"
          class="block w-full rounded px-6 py-2.5 text-left text-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-900/70"
          @click="() => handleClick(item)"
        >
          <span v-if="typeof item.label === 'function'">
            {{ item.label(payload) }}
          </span>
          <span v-else>
            {{ item.label }}
          </span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { IContextMenuItem } from '~/types'
import { contextMenuSymbol } from './contextMenuContext'

type ContextMenuProps = {
  items: IContextMenuItem<unknown>[]
  payload: unknown
}

const props = defineProps<ContextMenuProps>()

const context = inject(contextMenuSymbol, null)

function handleClick(item: IContextMenuItem<unknown>) {
  item.action(props.payload)
  context?.close()
}
</script>

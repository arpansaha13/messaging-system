<template>
  <div ref="containerRef" class="relative">
    <slot :on-context-menu="onContextMenu" :close="closeMenu" />
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { contextMenuSymbol } from './contextMenuContext'

const DROPDOWN_WIDTH = 192

const containerRef = ref<HTMLElement | null>(null)
const open = ref(false)
const position = ref({ top: 0, left: 0 })

function closeMenu() {
  open.value = false
}

function onContextMenu(event: MouseEvent) {
  const container = containerRef.value
  if (!container) {
    return
  }

  event.preventDefault()

  const rect = container.getBoundingClientRect()
  let left = event.clientX - rect.left
  const top = event.clientY - rect.top

  const dropdownRight = event.clientX + DROPDOWN_WIDTH
  if (dropdownRight > rect.right) {
    left -= dropdownRight - rect.right
  }

  position.value = { top, left }
  open.value = true
}

provide(contextMenuSymbol, {
  open,
  position,
  close: closeMenu,
})

useEventListener(window, 'click', () => {
  if (open.value) {
    closeMenu()
  }
})

useEventListener(window, 'keyup', event => {
  if (event.key === 'Escape') {
    closeMenu()
  }
})
</script>

import type { Ref } from 'vue'

export function useOverflow(target: Ref<HTMLElement | null>) {
  const isOverflowingX = ref(false)
  const isOverflowingY = ref(false)

  const updateMetrics = (element: HTMLElement | null) => {
    if (!element) {
      isOverflowingX.value = false
      isOverflowingY.value = false
      return
    }

    isOverflowingX.value = element.scrollWidth > element.clientWidth
    isOverflowingY.value = element.scrollHeight > element.clientHeight
  }

  watch(
    () => target.value,
    element => updateMetrics(element),
    { immediate: true },
  )

  useResizeObserver(target, entries => {
    const entry = entries[0]
    if (!entry) {
      return
    }
    updateMetrics(entry.target as HTMLElement)
  })

  return {
    isOverflowingX,
    isOverflowingY,
  }
}


<script setup lang="ts">
interface Props {
  dateString: string
}

const props = defineProps<Props>()

const formattedDate = computed(() => {
  const date = new Date(props.dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

  const timeString = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return timeString
  }

  if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return `Yesterday ${timeString}`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
})
</script>

<template>
  <time :datetime="dateString" class="text-xs text-gray-500 dark:text-gray-400">
    {{ formattedDate }}
  </time>
</template>

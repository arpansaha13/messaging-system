<template>
  <div>
    <label :for="id" class="sr-only"> Search </label>

    <div class="group relative overflow-hidden rounded-lg">
      <div class="absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon
          class="group-focus-within:text-brand-600 dark:group-focus-within:text-brand-500 pointer-events-none h-4 w-4 text-gray-600 transition-colors dark:text-gray-400"
          aria-hidden="true"
        />
      </div>

      <span
        class="group-focus-within:bg-brand-600 dark:group-focus-within:bg-brand-500 absolute inset-x-0 bottom-0 h-0.5 transition-colors"
      />

      <input
        :id="id"
        ref="inputRef"
        v-bind="$attrs"
        class="block w-full border-none bg-gray-200 py-2 pr-8 pl-12 text-sm text-gray-600 placeholder-gray-500 shadow focus:border-none focus:ring-0 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-400 dark:shadow-gray-950/40"
        :value="modelValue"
        @input="onInput"
      />

      <div v-if="modelValue" class="absolute inset-y-0 right-0 flex items-center pr-2">
        <button type="button" @click="clear">
          <XMarkIcon class="h-4 w-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/solid'

withDefaults(
  defineProps<{
    id: string
    modelValue?: string
  }>(),
  {
    modelValue: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function clear() {
  emit('update:modelValue', '')
  inputRef.value?.focus()
}
</script>

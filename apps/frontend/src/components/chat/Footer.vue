<template>
  <div class="flex w-full items-end gap-2">
    <UTextarea
      v-model="message"
      :rows="1"
      autoresize
      :maxrows="4"
      placeholder="Type a message..."
      variant="subtle"
      class="grow"
      data-testid="message-input"
      @update:model-value="emit('change')"
      @keydown="handleKeydown"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
    />
    <UButton icon="i-lucide-send" color="primary" data-testid="send-btn" @click="handleSend" />
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  send: [message: string]
  change: []
}>()

const message = defineModel<string>('message', { required: true })
const isComposing = ref(false)

function handleSend() {
  const trimmedMsg = message.value.trim()
  if (trimmedMsg) {
    emit('send', trimmedMsg)
    message.value = ''
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !isComposing.value) {
    e.preventDefault()
    handleSend()
  }
}

function handleCompositionStart() {
  isComposing.value = true
}

function handleCompositionEnd() {
  isComposing.value = false
}
</script>

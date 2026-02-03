<template>
  <div>
    <div v-for="(item, index) in renderMessages" :key="`${item.type}-${index}`">
      <ChatBodyMessage
        v-if="item.type === 'message'"
        :message="item.data"
        :auth-user-is-sender="authUserId === item.data.senderId"
      />
      <ChatBodyTempMessage v-else :message="item.data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IMessage, IMessageSending } from '@shared/types'
import type { IUser } from '~/types'

const props = defineProps<{
  authUserId: IUser['id']
  messages: Map<IMessage['id'], IMessage>
  tempMessages: Map<IMessageSending['hash'], IMessageSending>
}>()

// Render messages and temporary messages in chronological order
const renderMessages = computed(() => {
  const messageItr = props.messages.values()
  const tempMessageItr = props.tempMessages.values()
  const renderMap: Array<{ type: 'message'; data: IMessage } | { type: 'temp'; data: IMessageSending }> = []

  let messageItrResult = messageItr.next()
  let tempMessageItrResult = tempMessageItr.next()

  while (!messageItrResult.done && !tempMessageItrResult.done) {
    const message = messageItrResult.value
    const tempMessage = tempMessageItrResult.value
    const messageTime = new Date(message.createdAt).getTime()
    const tempMessageTime = new Date(tempMessage.createdInClientAt).getTime()

    if (messageTime <= tempMessageTime) {
      renderMap.push({ type: 'message', data: message })
      messageItrResult = messageItr.next()
    } else {
      renderMap.push({ type: 'temp', data: tempMessage })
      tempMessageItrResult = tempMessageItr.next()
    }
  }

  while (!messageItrResult.done) {
    const message = messageItrResult.value
    renderMap.push({ type: 'message', data: message })
    messageItrResult = messageItr.next()
  }

  while (!tempMessageItrResult.done) {
    const tempMessage = tempMessageItrResult.value
    renderMap.push({ type: 'temp', data: tempMessage })
    tempMessageItrResult = tempMessageItr.next()
  }

  return renderMap
})
</script>

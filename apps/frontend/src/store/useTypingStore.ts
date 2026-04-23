import { refAutoReset } from '@vueuse/core'
import type { IUser } from '~/types'
import type { Ref } from 'vue'

const clientTypingRefs = new Map<IUser['id'], Ref<boolean>>()

export function useTypingStore() {
  function getTypingRef(receiverId: IUser['id']) {
    if (!clientTypingRefs.has(receiverId)) {
      clientTypingRefs.set(receiverId, refAutoReset(false, 7000))
    }
    return clientTypingRefs.get(receiverId)!
  }

  function setTyping(receiverId: IUser['id']) {
    if (import.meta.client) {
      getTypingRef(receiverId).value = true
    }
  }

  function getTyping(receiverId?: IUser['id']) {
    if (!import.meta.client || !receiverId) {
      return null
    }
    return getTypingRef(receiverId).value
  }

  return {
    setTyping,
    getTyping,
  }
}

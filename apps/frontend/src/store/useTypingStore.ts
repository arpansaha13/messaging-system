import type { IUser } from '~/types'

export function useTypingStore() {
  const typingState = useState<Map<IUser['id'], boolean>>('typing', () => new Map())

  function setTyping(receiverId: IUser['id'], isTyping: boolean) {
    const next = new Map(typingState.value)
    next.set(receiverId, isTyping)
    typingState.value = next
  }

  function getTyping(receiverId?: IUser['id']) {
    if (!receiverId) {
      return null
    }
    return typingState.value.get(receiverId) ?? null
  }

  return {
    setTyping,
    getTyping,
  }
}

import type { IUser } from '~/types'
import type { IMessageSending } from '@shared/types'

type TempMessageMap = Map<string, IMessageSending>

export function usePersonalMessagesState() {
  const tempMessagesMap = useState<Map<IUser['id'], TempMessageMap>>('messages:temp', () => new Map())

  function cloneTempMessages() {
    return new Map(tempMessagesMap.value)
  }

  function upsertTempMessages(receiverId: IUser['id'], messages: IMessageSending[]) {
    const next = cloneTempMessages()
    const existing = next.get(receiverId) ?? new Map<string, IMessageSending>()
    messages.forEach(message => existing.set(message.hash, message))
    next.set(receiverId, existing)
    tempMessagesMap.value = next
  }

  function deleteTempMessage(receiverId: IUser['id'], hash: string) {
    if (!tempMessagesMap.value.has(receiverId)) {
      return
    }
    const next = cloneTempMessages()
    next.get(receiverId)?.delete(hash)
    tempMessagesMap.value = next
  }

  function getTempMessages(receiverId: IUser['id']) {
    return tempMessagesMap.value.get(receiverId) ?? new Map<string, IMessageSending>()
  }

  function getTempMessage(receiverId: IUser['id'], hash: string) {
    return tempMessagesMap.value.get(receiverId)?.get(hash) ?? null
  }

  return {
    upsertTempMessages,
    deleteTempMessage,
    getTempMessages,
    getTempMessage,
  }
}

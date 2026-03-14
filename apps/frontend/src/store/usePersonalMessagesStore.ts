import type { IUser } from '~/types'
import type { IMessageSending } from '@shared/types'
import { MessageStatus } from '@shared/constants'

type TempMessageMap = Map<string, IMessageSending>

export function usePersonalMessagesStore() {
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

  function updateTempMessageStatus(receiverId: IUser['id'], hash: string, status: MessageStatus.SENT) {
    const existing = tempMessagesMap.value.get(receiverId)
    if (!existing?.has(hash)) return
    const next = cloneTempMessages()
    const msg = next.get(receiverId)!.get(hash)!
    next.get(receiverId)!.set(hash, { ...msg, status })
    tempMessagesMap.value = next
  }

  return {
    upsertTempMessages,
    deleteTempMessage,
    getTempMessages,
    getTempMessage,
    updateTempMessageStatus,
  }
}

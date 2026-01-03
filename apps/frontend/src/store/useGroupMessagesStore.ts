import type { IChannel } from '~/types'
import type { IGroupMessageSending } from '@shared/types'

type TempMessageMap = Map<string, IGroupMessageSending>

export function useGroupMessagesStore() {
  const tempGroupMessagesMap = useState<Map<IChannel['id'], TempMessageMap>>('group-temp-messages', () => new Map())

  function cloneTempMessages() {
    return new Map(tempGroupMessagesMap.value)
  }

  function upsertTempGroupMessages(channelId: IChannel['id'], messages: IGroupMessageSending[]) {
    const next = cloneTempMessages()
    const existing = next.get(channelId) ?? new Map<string, IGroupMessageSending>()
    messages.forEach(message => existing.set(message.hash, message))
    next.set(channelId, existing)
    tempGroupMessagesMap.value = next
  }

  function deleteTempGroupMessage(channelId: IChannel['id'], hash: string) {
    if (!tempGroupMessagesMap.value.has(channelId)) {
      return
    }
    const next = cloneTempMessages()
    next.get(channelId)?.delete(hash)
    tempGroupMessagesMap.value = next
  }

  function getTempGroupMessages(channelId: IChannel['id']) {
    return tempGroupMessagesMap.value.get(channelId) ?? new Map<string, IGroupMessageSending>()
  }

  function getTempGroupMessage(channelId: IChannel['id'], hash: string) {
    return tempGroupMessagesMap.value.get(channelId)?.get(hash) ?? null
  }

  return {
    upsertTempGroupMessages,
    deleteTempGroupMessage,
    getTempGroupMessages,
    getTempGroupMessage,
  }
}

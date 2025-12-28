import type { IChannel } from '~/types'
import type { IGroupMessage, IGroupMessageSending } from '@shared/types'
import type { MessageStatus } from '@shared/constants'

type MessageMap = Map<IGroupMessage['id'], IGroupMessage>
type TempMessageMap = Map<string, IGroupMessageSending>

export function useGroupMessagesStore() {
  const groupMessagesMap = useState<Map<IChannel['id'], MessageMap>>('group-messages', () => new Map())
  const tempGroupMessagesMap = useState<Map<IChannel['id'], TempMessageMap>>('group-temp-messages', () => new Map())

  function cloneMessages() {
    return new Map(groupMessagesMap.value)
  }

  function cloneTempMessages() {
    return new Map(tempGroupMessagesMap.value)
  }

  async function ensureGroupMessages(channelId: IChannel['id']) {
    if (groupMessagesMap.value.has(channelId)) {
      return
    }
    const messages = await fetchGroupMessages(channelId)
    const next = cloneMessages()
    next.set(channelId, new Map(messages.map(message => [message.id, message])))
    groupMessagesMap.value = next
  }

  function upsertGroupMessages(channelId: IChannel['id'], newMessages: IGroupMessage[]) {
    const next = cloneMessages()
    const existing = next.get(channelId) ?? new Map<IGroupMessage['id'], IGroupMessage>()
    newMessages.forEach(message => existing.set(message.id, message))
    next.set(channelId, existing)
    groupMessagesMap.value = next
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

  function updateGroupMessageStatus(
    channelId: IChannel['id'],
    messageId: IGroupMessage['id'],
    newStatus: Exclude<MessageStatus, MessageStatus.SENDING>,
  ) {
    if (!groupMessagesMap.value.has(channelId)) {
      return
    }
    const next = cloneMessages()
    const message = next.get(channelId)?.get(messageId)
    if (message) {
      message.status = newStatus
      groupMessagesMap.value = next
    }
  }

  function getGroupMessages(channelId: IChannel['id']) {
    return groupMessagesMap.value.get(channelId) ?? new Map<IGroupMessage['id'], IGroupMessage>()
  }

  function getTempGroupMessages(channelId: IChannel['id']) {
    return tempGroupMessagesMap.value.get(channelId) ?? new Map<string, IGroupMessageSending>()
  }

  function hasGroupMessages(channelId: IChannel['id']) {
    return groupMessagesMap.value.has(channelId)
  }

  function getTempGroupMessage(channelId: IChannel['id'], hash: string) {
    return tempGroupMessagesMap.value.get(channelId)?.get(hash) ?? null
  }

  return {
    ensureGroupMessages,
    upsertGroupMessages,
    upsertTempGroupMessages,
    deleteTempGroupMessage,
    updateGroupMessageStatus,
    getGroupMessages,
    getTempGroupMessages,
    hasGroupMessages,
    getTempGroupMessage,
  }
}

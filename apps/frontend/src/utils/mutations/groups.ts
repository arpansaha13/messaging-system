import type { IChannel, IGroup, IInvite, IGroupMessage  } from '~/types'
import type { MessageStatus } from '~/constants'

export function createInvite(groupId: IGroup['id']) {
  const { $api } = useNuxtApp()
  return $api<IInvite>(`/api/groups/${groupId}/invites`, {
    method: 'POST',
  })
}

export async function createGroup(body: Pick<IGroup, 'name'>) {
  const { $api } = useNuxtApp()
  await $api<{ id: IGroup['id']; channels: IChannel['id'][] }>('/api/groups', {
    method: 'POST',
    body,
  })
  await refreshNuxtData(asyncKeys.groups)
}

export async function createChannel(groupId: IGroup['id'], body: Pick<IChannel, 'name'>) {
  const { $api } = useNuxtApp()
  return $api<IChannel>(`/api/groups/${groupId}/channels`, {
    method: 'POST',
    body,
  })
}

// =============================================
// ============== Group Messages ===============
// =============================================

/** Get cached groupMessages using useNuxtData */
export function getGroupMessagesData(channelId: IChannel['id']) {
  return useNuxtData<IGroupMessage[]>(asyncKeys.groupMessages(channelId)).data
}

/** Mutate the cached groupMessages data */
function mutateGroupMessagesData(channelId: IChannel['id'], mutator: (state: IGroupMessage[]) => void) {
  const groupMessagesData = getGroupMessagesData(channelId)
  if (!groupMessagesData.value) return

  mutator(groupMessagesData.value)
  // Trigger reactivity by reassigning
  groupMessagesData.value = [...groupMessagesData.value]
}

/** Add new message to group channel */
export function addGroupMessage(channelId: IChannel['id'], message: IGroupMessage) {
  mutateGroupMessagesData(channelId, messages => {
    messages.push(message)
  })
}

/** Update message status in group channel */
export function updateGroupMessageStatus(
  channelId: IChannel['id'],
  messageId: IGroupMessage['id'],
  newStatus: Exclude<MessageStatus, MessageStatus.SENDING>,
) {
  mutateGroupMessagesData(channelId, messages => {
    const message = messages.find(m => m.id === messageId)
    if (message) {
      message.status = newStatus
    }
  })
}

/** Upsert multiple messages (for socket events) */
export function upsertGroupMessages(channelId: IChannel['id'], newMessages: IGroupMessage[]) {
  mutateGroupMessagesData(channelId, messages => {
    newMessages.forEach(newMessage => {
      const idx = messages.findIndex(m => m.id === newMessage.id)
      if (idx === -1) {
        messages.push(newMessage)
      } else {
        messages[idx] = newMessage
      }
    })
  })
}

// =============================================
// ============== Group Operations =============
// =============================================

export async function handleNewChannel(groupId: number, channelId: number, name: string) {
  const { $api } = useNuxtApp()
  return $api('/api/groups/channel/new', {
    method: 'POST',
    body: {
      groupId,
      channelId,
      name,
    },
  })
}

export async function handleJoinGroup(groupId: number, channels: string[]) {
  const { $api } = useNuxtApp()
  return $api('/api/groups/join', {
    method: 'POST',
    body: {
      groupId,
      channels,
    },
  })
}

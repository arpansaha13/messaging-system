import type { IChannel, IGroup, IInvite, IUser } from '~/types'

export function fetchGroupMembers(groupId: IGroup['id']) {
  const { $api } = useNuxtApp()
  return $api<IUser[]>(`/api/groups/${groupId}/members`)
}

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

export function createChannel(groupId: IGroup['id'], body: Pick<IChannel, 'name'>) {
  const { $api } = useNuxtApp()
  return $api<{ groupId: IGroup['id']; channelId: IChannel['id'] }>(`/api/groups/${groupId}/channels`, {
    method: 'POST',
    body,
  })
}

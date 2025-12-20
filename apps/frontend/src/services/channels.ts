import type { IChannel, IGroup } from '~/types'

export async function createChannel(groupId: IGroup['id'], body: Pick<IChannel, 'name'>) {
  const { $api } = useNuxtApp()
  const response = await $api<IChannel>(`/api/groups/${groupId}/channels`, {
    method: 'POST',
    body,
  })
  await refreshNuxtData(asyncKeys.groupChannels(groupId))
  return response
}

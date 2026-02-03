import type { IInvite } from '~/types'

interface AcceptInviteResponse {
  groupId: number
  channels: number[]
}

export function fetchInvite(hash: string) {
  const { $api } = useNuxtApp()
  return $api<IInvite>(`/api/invites/${hash}`)
}

export function acceptInvite(hash: string) {
  const { $api } = useNuxtApp()
  return $api<AcceptInviteResponse>(`/api/invites/${hash}/accept`, {
    method: 'POST',
  })
}

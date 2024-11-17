'use server'

import rfetch from '~/utils/api/rfetch'
import type { IChannel, IGroup, IInvite } from '@shared/types/client'

interface AcceptInviteResponse {
  groupId: IGroup['id']
  channels: IChannel['id'][]
}

export async function getInvite(hash: IInvite['hash']) {
  return rfetch<IInvite>(`invites/${hash}`)
}

export async function acceptInvite(hash: IInvite['hash']) {
  return rfetch<AcceptInviteResponse>(`invites/${hash}/accept`, { method: 'POST' })
}

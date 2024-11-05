'use server'

import { redirect } from 'next/navigation'
import rfetch from '~/utils/api/rfetch'
import type { IGroup, IInvite } from '@shared/types/client'

export async function getInvite(hash: IInvite['hash']) {
  return rfetch<IInvite>(`invites/${hash}`)
}

async function acceptInvite(hash: IInvite['hash']) {
  return rfetch<IGroup>(`invites/${hash}/accept`, { method: 'POST' })
}

export async function joinGroup(hash: IInvite['hash']) {
  const { data: group } = await acceptInvite(hash)

  if (group) {
    return redirect(`/groups/${group.id}`)
  }
}

import { redirect } from 'next/navigation'
import { Button } from '~/components/ui'
import { GroupAvatar } from '~/components/common'
import rfetch from '~/utils/api/rfetch'
import type { IGroup, IInvite } from '@shared/types/client'

export default async function Page(request: Request) {
  // @ts-ignore
  const inviteHash = request.params.hash
  const { data: invite, error } = await _getInvite(inviteHash)

  async function joinGroup() {
    'use server'

    const { data: group } = await _acceptInvite(inviteHash)

    if (group) {
      return redirect(`/groups/${group.id}`)
    }
  }

  if (error) {
    console.log(error)
    return redirect(`/groups/${error.data.group.id}`)
  }

  return (
    <div className="flex h-full items-center justify-center bg-gray-200 dark:bg-gray-800">
      <form
        action={joinGroup}
        className="flex w-[26rem] flex-col items-center rounded-lg bg-gray-50 p-6 shadow dark:bg-gray-900"
      >
        <GroupAvatar src={null} size={6} />

        <p className="mt-4 text-xl font-semibold">
          You have been invited to <span className="text-brand-600 dark:text-brand-500">{invite.group.name}</span>
        </p>

        <div className="mt-4">
          <Button type="submit" className="mx-auto w-max">
            Join group
          </Button>
        </div>
      </form>
    </div>
  )
}

async function _getInvite(hash: IInvite['hash']) {
  return rfetch<IInvite>(`invites/${hash}`)
}

async function _acceptInvite(hash: IInvite['hash']) {
  return rfetch<IGroup>(`invites/${hash}/accept`, { method: 'POST' })
}

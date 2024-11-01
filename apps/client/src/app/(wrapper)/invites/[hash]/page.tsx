import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { Button } from '~/components/ui'
import { GroupAvatar } from '~/components/common'
import _fetch from '~/utils/api/_fetch'
import type { IGroup, IInvite } from '@shared/types/client'

export default async function Page(request: Request) {
  const inviteHash = request.params.hash
  const { data: invite, error } = await _getInvite(inviteHash)

  if (!isNullOrUndefined(error)) {
    return redirect(`/groups/${error.data.group.id}`)
  }

  async function joinGroup() {
    'use server'

    const { data: group } = await _acceptInvite(inviteHash)

    if (group) {
      return redirect(`/groups/${group.id}`)
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-gray-800">
      <form action={joinGroup} className="flex w-[26rem] flex-col items-center rounded-lg bg-gray-900 p-6">
        <GroupAvatar src={null} size={6} />

        <p className="mt-4 text-xl font-semibold">
          You have been invited to <span className="text-brand-500">{invite.group.name}</span>
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

type FetchResult<T> = { data: T; error: null } | { data: null; error: any }

async function _getInvite(hash: IInvite['hash']): Promise<FetchResult<IInvite>> {
  const cookieStore = cookies()

  try {
    const data = await _fetch(
      `invites/${hash}`,
      {
        method: 'GET',
        headers: {
          Cookie: cookieStore.toString(),
        },
      },
      true,
    )
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

async function _acceptInvite(hash: IInvite['hash']): Promise<FetchResult<IGroup>> {
  const cookieStore = cookies()

  try {
    const data = await _fetch(
      `invites/${hash}/accept`,
      {
        method: 'POST',
        headers: {
          Cookie: cookieStore.toString(),
        },
      },
      true,
    )
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

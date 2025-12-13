'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HttpCode } from '~/utils/api/HttpCode.enum'
import { useGetInviteQuery } from '~/store/features/invites/invites.api.slice'
import JoinGroupForm from './JoinGroupForm'
import type { IInvite } from '~/types'

interface InviteClientProps {
  inviteHash: string
}

export default function InviteClient(props: Readonly<InviteClientProps>) {
  const { inviteHash } = props
  const router = useRouter()

  const { data: invite, error, isLoading } = useGetInviteQuery(inviteHash)

  useEffect(() => {
    if (!error) return
    // Redirect on conflict
    if ((error as any).status === HttpCode.CONFLICT) {
      const groupId = (error as any).data?.group?.id
      if (groupId) router.replace(`/groups/${groupId}`)
    }
  }, [error, router])

  if (isLoading) return null

  if (error) {
    if ((error as any).status === HttpCode.INVALID_OR_EXPIRED) {
      return (
        <div className="flex w-96 flex-col items-center rounded-lg bg-gray-50 p-6 shadow dark:bg-gray-900">
          <p className="text-center text-xl font-semibold">Invalid Invite</p>
          <p className="mt-2 text-center text-sm">This invite is either invalid or has expired.</p>
        </div>
      )
    }

    return null
  }

  return invite ? <JoinGroupForm invite={invite as IInvite} /> : null
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SocketEvents } from '@shared/constants'
import { useSocket } from '~/hooks/useSocket'
import { GroupAvatar } from '~/components/common'
import { Button } from '~/components/ui'
import { acceptInvite } from './actions'
import type { IInvite } from '@shared/types/client'

interface JoinGroupFormProps {
  invite: IInvite
}

export default function JoinGroupForm(props: Readonly<JoinGroupFormProps>) {
  const { invite } = props

  const { socket } = useSocket()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const { data } = await acceptInvite(invite.hash)
    if (data) {
      socket?.emit(SocketEvents.GROUP.JOIN_GROUP, {
        groupId: data.groupId,
        channels: data.channels.join(','),
      })
      router.replace(`/groups/${data.groupId}`)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-[26rem] flex-col items-center rounded-lg bg-gray-50 p-6 shadow dark:bg-gray-900"
    >
      <GroupAvatar src={null} size={6} />

      <p className="mt-4 text-center text-xl font-semibold">
        You have been invited to <span className="text-brand-600 dark:text-brand-500">{invite.group.name}</span>
      </p>

      <div className="mt-4">
        <Button type="submit" loading={loading} className="mx-auto w-max">
          Join group
        </Button>
      </div>
    </form>
  )
}

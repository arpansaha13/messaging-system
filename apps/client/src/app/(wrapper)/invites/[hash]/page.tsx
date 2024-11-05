import { redirect } from 'next/navigation'
import { Button } from '~/components/ui'
import { GroupAvatar } from '~/components/common'
import { HttpCode } from '~/utils/api/HttpCode.enum'
import { getInvite, joinGroup } from './actions'
import type { Exception } from '~/utils/api/rfetch'

interface WrapperProps {
  children: React.ReactNode
}

export default async function Page(request: Readonly<Request>) {
  // @ts-ignore
  const inviteHash = request.params.hash
  const { data: invite, error } = await getInvite(inviteHash)

  if (error) {
    return handleError(error)
  }

  async function handleSubmit() {
    'use server'
    return joinGroup(inviteHash)
  }

  return (
    <Wrapper>
      <form
        action={handleSubmit}
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
    </Wrapper>
  )
}

function Wrapper(props: Readonly<WrapperProps>) {
  const { children } = props

  return <div className="flex h-full items-center justify-center bg-gray-200 dark:bg-gray-800">{children}</div>
}

function InviteExpired() {
  return (
    <div className="flex w-96 flex-col items-center rounded-lg bg-gray-50 p-6 shadow dark:bg-gray-900">
      <p className="text-center text-xl font-semibold">Invalid Invite</p>
      <p className="mt-2 text-center text-sm">This invite is either invalid or has expired.</p>
    </div>
  )
}

function handleError(error: Exception) {
  if (error.status === HttpCode.INVALID_OR_EXPIRED) {
    return (
      <Wrapper>
        <InviteExpired />
      </Wrapper>
    )
  }

  if (error.status === HttpCode.CONFLICT) {
    return redirect(`/groups/${error.data.group.id}`)
  }

  return null
}

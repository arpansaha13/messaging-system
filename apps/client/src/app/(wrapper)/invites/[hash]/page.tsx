import { redirect } from 'next/navigation'
import { HttpCode } from '~/utils/api/HttpCode.enum'
import { getInvite } from './actions'
import type { Exception } from '~/utils/api/rfetch'
import JoinGroupForm from './JoinGroupForm'

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

  return (
    <Wrapper>
      <JoinGroupForm invite={invite} />
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

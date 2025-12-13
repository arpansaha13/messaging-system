import InviteClient from './InviteClient'

interface PageProps {
  params: { hash: string }
}

export default function Page(request: Readonly<PageProps>) {
  const inviteHash = request.params.hash

  return (
    <div className="flex h-full items-center justify-center bg-gray-200 dark:bg-gray-800">
      <InviteClient inviteHash={inviteHash} />
    </div>
  )
}

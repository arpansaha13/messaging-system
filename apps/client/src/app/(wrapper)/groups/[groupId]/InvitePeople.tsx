import { useState } from 'react'
import { UserPlusIcon } from '@heroicons/react/24/solid'
import CreateInviteModal from '~/components/group/invites/CreateInviteModal'
import Button from './Button'
import type { IGroup } from '@shared/types/client'

interface InvitePeopleProps {
  group: IGroup
}

export default function InvitePeople(props: Readonly<InvitePeopleProps>) {
  const { group } = props

  const [open, setOpen] = useState(false)

  return (
    <>
      <Button icon={UserPlusIcon} text="Invite People" onClick={() => setOpen(true)} />
      <CreateInviteModal open={open} setOpen={setOpen} groupId={group.id} />
    </>
  )
}

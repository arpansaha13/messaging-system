import { useState } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid'
import AddChannelModal from '~/components/group/add-channel/AddChannelModal'
import Button from './Button'
import type { IGroup } from '@shared/types/client'

interface AddChannelProps {
  group: IGroup
}

export default function AddChannel(props: Readonly<AddChannelProps>) {
  const { group } = props

  const [open, setOpen] = useState(false)

  return (
    <>
      <Button icon={ChatBubbleLeftRightIcon} text="Add Channel" onClick={() => setOpen(true)} />
      <AddChannelModal open={open} setOpen={setOpen} groupId={group.id} />
    </>
  )
}

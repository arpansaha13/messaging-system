import { SocketEvents } from '@shared/constants'
import { useSocket } from '~/hooks/useSocket'
import { Input } from '~/components/ui'
import { FormModal } from '~/components/common'
import { useAddGroupMutation } from '~/store/features/groups/groups.api.slice'
import getFormData from '~/utils/getFormData'
import { useAddGroupContext } from './context'

interface ICreateGroupFormData {
  name: string
}

export default function AddGroupModal() {
  const { open, setOpen } = useAddGroupContext()!
  const [addGroup] = useAddGroupMutation()
  const { socket } = useSocket()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = getFormData<ICreateGroupFormData>(e.currentTarget)
    const { data } = await addGroup(formData)
    socket?.emit(SocketEvents.GROUP.NEW_GROUP, {
      groupId: data!.id,
      channels: data!.channels.join(','),
    })
    setOpen(false)
  }

  return (
    <FormModal open={open} setOpen={setOpen} heading="Create new group" action={onSubmit} submitButtonText="Create">
      <Input
        required
        label="Choose a name for your group"
        id="name"
        name="name"
        type="text"
        className="mt-4"
        autoComplete="off"
      />
    </FormModal>
  )
}

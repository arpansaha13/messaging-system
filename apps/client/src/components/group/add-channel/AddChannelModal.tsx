import { Input } from '~/components/ui'
import { FormModal } from '~/components/common'
import { useAddChannelMutation } from '~/store/features/groups/groups.api.slice'
import getFormData from '~/utils/getFormData'
import type { IGroup } from '@shared/types/client'

interface ICreateChannelFormData {
  name: string
}

interface AddChannelModalProps {
  groupId: IGroup['id']
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function AddChannelModal(props: Readonly<AddChannelModalProps>) {
  const { groupId, open, setOpen } = props
  const [addChannel] = useAddChannelMutation()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = getFormData<ICreateChannelFormData>(e.currentTarget)
    await addChannel({
      groupId,
      body: formData,
    })
    setOpen(false)
  }

  return (
    <FormModal open={open} setOpen={setOpen} heading="Create new channel" action={onSubmit} submitButtonText="Create">
      <Input required label="Choose a name for the channel" id="name" name="name" type="text" className="mt-4" />
    </FormModal>
  )
}

import { Input } from '~/components/ui'
import FormModal from '~/components/common/FormModal'
import { useAddGroupMutation } from '~/store/features/groups/groups.api.slice'
import getFormData from '~/utils/getFormData'
import { useAddGroupContext } from './context'

interface ICreateGroupFormData {
  name: string
}

export default function AddGroupModal() {
  const { open, setOpen } = useAddGroupContext()!
  const [addGroup] = useAddGroupMutation()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = getFormData<ICreateGroupFormData>(e.currentTarget)
    await addGroup(formData)
    setOpen(false)
  }

  return (
    <FormModal open={open} setOpen={setOpen} heading="Create new group" onSubmit={onSubmit} submitButtonText="Create">
      <Input required label="Choose a name for your group" id="name" name="name" type="text" className="mt-4" />
    </FormModal>
  )
}

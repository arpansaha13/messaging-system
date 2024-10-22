import { DialogTitle } from '@headlessui/react'
import { Input, Button, Modal } from '~/components/ui'
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
    <Modal open={open} setOpen={setOpen}>
      <div>
        <DialogTitle as="h3" className="text-center text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Create new group
        </DialogTitle>

        <form className="mt-4" onSubmit={onSubmit}>
          <Input label="Choose a name for your group" id="name" name="name" type="text" required />

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <Button type="submit" className="sm:col-start-2">
              Create
            </Button>

            <Button theme="secondary" className="mt-3 sm:col-start-1 sm:mt-0" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

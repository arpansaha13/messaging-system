import { DialogTitle } from '@headlessui/react'
import BaseInput from '~base/BaseInput'
import BaseButton from '~base/BaseButton'
import Modal from '~common/Modal'
import { useAppDispatch } from '~/store/hooks'
import { addGroup } from '~/store/features/groups/group.slice'
import getFormData from '~/utils/getFormData'
import { _postGroups } from '~/utils/api'
import { useAddGroupContext } from './context'

interface ICreateGroupFormData {
  name: string
}

export default function AddGroupModal() {
  const { open, setOpen } = useAddGroupContext()!
  const dispatch = useAppDispatch()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = getFormData<ICreateGroupFormData>(e.currentTarget)

    const newGroup = await _postGroups(formData)
    dispatch(addGroup(newGroup))

    setOpen(false)
  }

  return (
    <Modal open={open} setOpen={setOpen}>
      <div>
        <DialogTitle as="h3" className="text-center text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Create new group
        </DialogTitle>

        <form className="mt-4" onSubmit={onSubmit}>
          <BaseInput label="Choose a name for your group" id="name" name="name" type="text" required />

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <BaseButton type="submit" className="sm:col-start-2">
              Create
            </BaseButton>

            <BaseButton secondary className="mt-3 sm:col-start-1 sm:mt-0" onClick={() => setOpen(false)}>
              Cancel
            </BaseButton>
          </div>
        </form>
      </div>
    </Modal>
  )
}

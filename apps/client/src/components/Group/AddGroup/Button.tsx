import { PlusIcon } from '@heroicons/react/24/outline'
import { useAddGroupContext } from './context'

export default function AddGroupButton() {
  const { setOpen } = useAddGroupContext()!

  function openAddGroupModal() {
    setOpen(true)
  }

  return (
    <button
      className="hover:bg-brand-200/60 hover:text-brand-900 hover:dark:bg-brand-800/60 hover:dark:text-brand-200 focus:dark:ring-brand-800 focus:ring-brand-300 block rounded p-2 transition-colors focus:ring focus:ring-offset-2 focus:ring-offset-gray-50 focus:dark:ring-offset-gray-300"
      onClick={openAddGroupModal}
    >
      <PlusIcon className="size-6 flex-shrink-0" />
    </button>
  )
}

import AddGroupButton from './Button'
import AddGroupProvider from './context'
import AddGroupModal from './Modal'

export default function AddGroup() {
  return (
    <AddGroupProvider>
      <AddGroupButton />
      <AddGroupModal />
    </AddGroupProvider>
  )
}

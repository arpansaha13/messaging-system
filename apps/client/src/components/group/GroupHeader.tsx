import { useState } from 'react'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'
import { GroupAvatar } from '~/components/common'
import type { IGroup } from '@shared/types/client'
import AddChannelModal from './add-channel/AddChannelModal'

interface GroupHeaderProps {
  group: IGroup
}

export default function GroupHeader(props: Readonly<GroupHeaderProps>) {
  const { group } = props
  const [addChannelModalOpen, setAddChannelModalOpen] = useState(false)

  const menuItems = [
    {
      name: 'Add Channel',
      action: () => {
        setAddChannelModalOpen(true)
      },
    },
  ]

  return (
    <div className="relative bg-gray-50 p-4 shadow dark:bg-gray-800">
      <div className="mt-8 flex items-center gap-4">
        <GroupAvatar src={null} alt="" size={4} />

        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
        </div>
      </div>

      <Menu as="div" className="absolute right-2 top-2">
        <MenuButton className="focus:ring-brand-500 block rounded p-1 transition-colors hover:bg-gray-600/60 focus:outline-none focus:ring-2">
          <EllipsisHorizontalIcon className="size-6 flex-shrink-0" />
        </MenuButton>

        <MenuItems
          anchor={{ to: 'bottom end', gap: '0.25rem' }}
          transition
          className="w-48 origin-top rounded-md bg-gray-50 text-gray-800 shadow-md transition duration-200 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 dark:bg-gray-800 dark:text-gray-100 dark:shadow-black/70"
        >
          {menuItems.map(menuItem => (
            <MenuItem
              as="button"
              key={menuItem.name}
              type="button"
              className="block w-full rounded px-6 py-2.5 text-left text-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-900/70"
              onClick={menuItem.action}
            >
              {menuItem.name}
            </MenuItem>
          ))}
        </MenuItems>
      </Menu>

      <AddChannelModal open={addChannelModalOpen} setOpen={setAddChannelModalOpen} groupId={group.id} />
    </div>
  )
}

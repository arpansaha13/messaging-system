import { Fragment } from 'react'
import { Menu, MenuItem, Transition } from '@headlessui/react'

interface ContextMenuProps {
  open: boolean
  position: Record<'top' | 'left', number>
  menuItems: {
    slot: string | React.ReactNode
    onClick: () => void
  }[]
}

export default function ContextMenu(props: Readonly<ContextMenuProps>) {
  const { open, position, menuItems } = props

  return (
    <Menu>
      <Transition
        as={Fragment}
        show={open}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        {/* MenuItems */}
        {/* Headless UI doesn't support context menu (open on right click) yet */}
        <div
          className="absolute z-10 w-48 origin-top rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-md shadow-gray-700 dark:shadow-black/70 focus:outline-none"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <div className="px-0.5 py-1.5">
            {menuItems.map((menuItem, i) => (
              <MenuItem
                key={i}
                as="button"
                className="block w-full px-6 py-2.5 text-sm text-left rounded hover:bg-gray-200 dark:hover:bg-gray-900/70 transition-colors"
                onClick={menuItem.onClick}
              >
                {menuItem.slot}
              </MenuItem>
            ))}
          </div>
        </div>
      </Transition>
    </Menu>
  )
}

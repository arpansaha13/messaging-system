import { createContext, Fragment, useContext, useState } from 'react'
import { Menu, MenuItem, Transition } from '@headlessui/react'
import type { IContextMenuItem } from '@pkg/types'

interface IContextMenuHandlers {
  onBlur: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

interface ContextMenuWrapperProps {
  children: (handlers: IContextMenuHandlers) => React.ReactNode
}

interface ContextMenuProps {
  items: IContextMenuItem[]

  /**
   * This payload will be passed to the menuItem.onClick method
   * for identification of the concerned list-item
   */
  payload?: any
}

interface IContextMenuContext {
  open: boolean
  position: Record<'top' | 'left', number>
}

const ContextMenuContext = createContext<IContextMenuContext | null>(null)

export function ContextMenuWrapper({ children }: Readonly<ContextMenuWrapperProps>) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const DROPDOWN_WIDTH = 192

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault()

    const rect = e.currentTarget.getBoundingClientRect()
    let left = e.clientX - rect.left
    let top = e.clientY - rect.top

    // Handle overflow to the right
    {
      const dropDownRight = DROPDOWN_WIDTH + e.clientX

      if (dropDownRight > rect.right) {
        const excess = dropDownRight - rect.right
        left -= excess
      }
    }
    // TODO: handle overflow at the bottom

    setOpen(true)
    setPosition({ top, left })
  }

  function onBlur() {
    setOpen(false)
  }

  const handlers = { onBlur, onContextMenu }

  return <ContextMenuContext.Provider value={{ open, position }}>{children(handlers)}</ContextMenuContext.Provider>
}

export function ContextMenu(props: Readonly<ContextMenuProps>) {
  const { items, payload } = props
  const { open, position } = useContext(ContextMenuContext)!

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
            {items.map((item, i) => (
              <MenuItem
                key={i}
                as="button"
                type="button"
                className="block w-full px-6 py-2.5 text-sm text-left rounded hover:bg-gray-200 dark:hover:bg-gray-900/70 transition-colors"
                onClick={e => item.onClick(e, payload)}
              >
                {item.slot}
              </MenuItem>
            ))}
          </div>
        </div>
      </Transition>
    </Menu>
  )
}

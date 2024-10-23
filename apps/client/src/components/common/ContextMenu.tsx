'use client'

import { createContext, Fragment, useContext, useRef, useState } from 'react'
import { useClickAway } from 'react-use'
import { FocusTrap, Menu, Transition } from '@headlessui/react'
import type { IContextMenuItem } from '@shared/types/client'

interface IContextMenuWrapperRenderProps {
  close: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

interface ContextMenuWrapperProps {
  children: (renderProps: IContextMenuWrapperRenderProps) => React.ReactNode
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
  close: () => void
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

  function close() {
    setOpen(false)
  }

  const renderProps = { close, onContextMenu }

  return (
    <ContextMenuContext.Provider value={{ open, position, close }}>{children(renderProps)}</ContextMenuContext.Provider>
  )
}

export function ContextMenu(props: Readonly<ContextMenuProps>) {
  const { items, payload } = props

  const ref = useRef<HTMLDivElement>(null)
  const { open, position, close } = useContext(ContextMenuContext)!

  function handleClick(e: React.MouseEvent, item: IContextMenuItem) {
    item.action(e, payload)
    close()
  }

  useClickAway(ref, close)

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
        {/* Headless UI doesn't support context menu (open on right click) yet */}
        <div
          ref={ref}
          className="absolute z-10 w-48 origin-top rounded-md bg-gray-50 text-gray-800 shadow-md focus:outline-none dark:bg-gray-800 dark:text-gray-100 dark:shadow-black/70"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <FocusTrap className="px-0.5 py-1.5">
            {items.map((item, i) => (
              <button
                key={i}
                type="button"
                className="block w-full rounded px-6 py-2.5 text-left text-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-900/70"
                onClick={e => {
                  handleClick(e, item)
                }}
              >
                {item.slot}
              </button>
            ))}
          </FocusTrap>
        </div>
      </Transition>
    </Menu>
  )
}

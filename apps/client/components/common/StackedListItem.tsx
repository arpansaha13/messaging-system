import { useState } from 'react'
import Avatar from '~common/Avatar'
import ContextMenu from '~common/ContextMenu'
import type { IContextMenuItem } from '@pkg/types'

interface StackedListItemProps {
  image: string | null
  title: string
  subtitle: string
  text: string
  menuItems?: IContextMenuItem[]
  onClick: () => void
}

export default function StackedListItem(props: Readonly<StackedListItemProps>) {
  const { image, title, subtitle, text, menuItems, onClick } = props

  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const DROPDOWN_WIDTH = 192

  const eventHandlers = {
    onClick,

    // Register these handlers only if needed
    ...(menuItems && {
      onBlur: () => {
        setOpen(false)
      },
      onContextMenu: (e: React.MouseEvent) => {
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
      },
    }),
  }

  return (
    <li className="relative">
      <button
        className="px-3 w-full text-left hover:bg-gray-200/60 dark:hover:bg-gray-600/40 flex items-center"
        {...eventHandlers}
      >
        <Avatar src={image} />

        <div className="ml-4 py-3 w-full">
          <div className="flex justify-between">
            <p className="text-base text-black dark:text-gray-50">{title}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">{subtitle}</p>
          </div>
          <div className="mt-1 flex justify-between">
            {/* TODO: Make a slot for icons */}
            <p className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-1 line-clamp-1">{text}</p>
          </div>
        </div>
      </button>

      {menuItems && <ContextMenu open={open} position={position} items={menuItems} />}
    </li>
  )
}

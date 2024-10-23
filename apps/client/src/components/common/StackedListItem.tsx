import { isNullOrUndefined } from '@arpansaha13/utils'
import { Avatar, ContextMenu, ContextMenuWrapper } from '~/components/common'
import type { IContextMenuItem } from '@shared/types/client'

interface StackedListItemProps {
  image: string | null
  title: string | React.ReactNode
  subtitle: string | React.ReactNode
  text: string
  menuItems?: IContextMenuItem[]
  onClick: () => void

  /**
   * This payload will be passed to the menuItem.onClick method
   * for identification of the concerned list-item
   */
  payload?: any
}

interface StackedListItemButtonProps extends Pick<StackedListItemProps, 'image' | 'title' | 'subtitle' | 'text'> {
  eventHandlers: {
    onClick: () => void
    onContextMenu?: (e: React.MouseEvent) => void
  }
}

export default function StackedListItem(props: Readonly<StackedListItemProps>) {
  const { menuItems, payload, onClick, ...remainingProps } = props

  if (isNullOrUndefined(menuItems)) {
    return (
      <li>
        <StackedListItemButton {...remainingProps} eventHandlers={{ onClick }} />
      </li>
    )
  }

  return (
    <ContextMenuWrapper>
      {({ onContextMenu }) => (
        <li className="relative">
          <StackedListItemButton {...remainingProps} eventHandlers={{ onClick, onContextMenu }} />

          <ContextMenu payload={payload} items={menuItems} />
        </li>
      )}
    </ContextMenuWrapper>
  )
}

function StackedListItemButton(props: Readonly<StackedListItemButtonProps>) {
  const { image, title, subtitle, text, eventHandlers } = props

  return (
    <button
      className="flex w-full items-center rounded px-3 text-left transition-colors hover:bg-gray-200/80 dark:hover:bg-gray-600/40"
      {...eventHandlers}
    >
      <Avatar src={image} />

      <div className="ml-4 w-full py-3">
        <div className="flex justify-between">
          <p className="text-base text-black dark:text-gray-50">{title}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-sm italic text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className="mt-1 flex justify-between">
          {/* TODO: Make a slot for icons */}
          <p className="line-clamp-1 flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">{text}</p>
        </div>
      </div>
    </button>
  )
}

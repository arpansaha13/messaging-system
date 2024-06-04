import { isNullOrUndefined } from '@arpansaha13/utils'
import Avatar from '~common/Avatar'
import { ContextMenu, ContextMenuWrapper } from '~common/ContextMenu'
import type { IContextMenuItem } from '@pkg/types'

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
    onBlur?: () => void
    onContextMenu?: (e: React.MouseEvent) => void
  }
}

export default function StackedListItem(props: Readonly<StackedListItemProps>) {
  const { menuItems, payload, onClick, ...remainingProps } = props

  if (isNullOrUndefined(menuItems)) {
    return (
      <li className="relative">
        <StackedListItemButton {...remainingProps} eventHandlers={{ onClick }} />
      </li>
    )
  }

  return (
    <ContextMenuWrapper>
      {({ onBlur, onContextMenu }) => (
        <li className="relative">
          <StackedListItemButton {...remainingProps} eventHandlers={{ onBlur, onClick, onContextMenu }} />

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
      className="px-3 w-full text-left hover:bg-gray-200/80 dark:hover:bg-gray-600/40 flex items-center rounded transition-colors"
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
  )
}

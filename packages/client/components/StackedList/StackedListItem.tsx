import { memo } from 'react'
import { format, parseISO } from 'date-fns'
// Utils
import classNames from '../../utils/classNames'
// Components
import Avatar from '../Avatar'

export interface StackedListItemProps {
  userId: number
  name: string | null
  dp: string | null
  time?: string // Contact List does not show time
  text: string
  active?: number | null // Contact List items will not have a active item
  onClick?: () => void
}

const StackedListItem = ({ userId, name, dp, time, text, active, onClick }: StackedListItemProps) => {
  return (
    <li>
      <button
        className={classNames(
          'px-3 w-full text-left flex items-center relative',
          userId === active ? 'bg-gray-700/90' : 'hover:bg-gray-600/40',
        )}
        onClick={onClick}
      >
        <span className="absolute inset-0" />
        <Avatar src={dp} />

        <div className="ml-4 py-3 h-full w-full border-b border-gray-700">
          <div className="flex justify-between">
            {/* If the user, with whom the chat is, is not in out contacts, then show [Unknown] */}
            <p className="text-base text-gray-50">{name ?? '[Unknown]'}</p>
            {time && (
              <p className="text-xs text-gray-400 flex items-end">
                <span>{format(parseISO(time), 'h:mm a')}</span>
              </p>
            )}
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-gray-400 line-clamp-1">{text ?? 'Hey there! I am using WhatsApp.'}</p>
          </div>
        </div>
      </button>
    </li>
  )
}
export default memo(StackedListItem)

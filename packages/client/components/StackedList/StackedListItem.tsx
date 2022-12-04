import { memo } from 'react'
import { format, parseISO } from 'date-fns'
// Utils
import classNames from '../../utils/classNames'
// Components
import Avatar from '../Avatar'
import MsgStatusIcon from '../MsgStatusIcon'
// Enum
import { MessageStatus } from '../../types'

export interface StackedListItemProps {
  userId: number
  name: string | null
  dp: string | null
  time?: string | null // Contact List does not show time
  text: string | null
  active?: number | null // Contact List items will not have a active item
  status?: MessageStatus | null // Contact List items will not have status
  onClick?: () => void
}

const StackedListItem = ({ userId, name, dp, time, text, active, status, onClick }: StackedListItemProps) => {
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

        <div className="ml-4 py-3 w-full border-b border-gray-700">
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
            <p
              className={classNames(
                'flex items-center text-sm text-gray-400 space-x-1 line-clamp-1',
                text === null ? 'h-5' : '', // same as line-height of 'text-sm'
              )}
            >
              {status && <MsgStatusIcon status={status} />}
              {text && <span>{text}</span>}
            </p>
          </div>
        </div>
      </button>
    </li>
  )
}
export default memo(StackedListItem)

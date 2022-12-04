import { memo } from 'react'
import { format, parseISO } from 'date-fns'
// Utils
import classNames from '../../utils/classNames'
// Components
import Avatar from '../Avatar'
import MsgStatusIcon from '../MsgStatusIcon'
import ChatSidebarItemDropDown from './ChatSidebarItemDropDown'
// Enum
import { MessageStatus } from '../../types'

export interface StackedListItemProps {
  userId: number
  alias: string | null
  dp: string | null
  time: string | null
  latestMsgContent: string | null
  active: number | null
  status: MessageStatus | null
  onClick: () => void
}

const ChatSidebarItem = ({
  userId,
  alias,
  dp,
  time,
  latestMsgContent,
  active,
  status,
  onClick,
}: StackedListItemProps) => {
  const menuItems = [
    {
      slot: 'Archive chat',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Mute notifications',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Delete chat',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Pin chat',
      onClick() {
        console.log('clicked')
      },
    },
    {
      slot: 'Mark as unread',
      onClick() {
        console.log('clicked')
      },
    },
  ]

  return (
    <li>
      <div
        className={classNames(
          'px-3 w-full text-left flex items-center relative',
          userId === active ? 'bg-gray-700/90' : 'hover:bg-gray-600/40',
        )}
        onClick={onClick}
      >
        <span className="absolute inset-0" />
        <Avatar src={dp} />

        <div className="ml-4 py-3 w-full border-b border-gray-700">
          <div className="flex justify-between items-center">
            {/* If the user, with whom the chat is, is not in contacts, then show [Unknown] */}
            <p className="text-base text-gray-50">{alias ?? '[Unknown]'}</p>
            {time && (
              <p className="text-xs text-gray-400 flex items-end">
                <span>{format(parseISO(time), 'h:mm a')}</span>
              </p>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p
              className={classNames(
                'flex items-center text-sm text-gray-400 space-x-1 line-clamp-1',
                latestMsgContent === null ? 'h-5' : '', // same as line-height of 'text-sm'
              )}
            >
              {status && <MsgStatusIcon status={status} />}
              {latestMsgContent && <span>{latestMsgContent}</span>}
            </p>
            <ChatSidebarItemDropDown menuItems={menuItems} />
          </div>
        </div>
      </div>
    </li>
  )
}
export default memo(ChatSidebarItem)

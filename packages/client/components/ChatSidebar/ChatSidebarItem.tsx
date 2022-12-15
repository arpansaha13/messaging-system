import { memo } from 'react'
import { format, parseISO } from 'date-fns'
// Utils
import classNames from '../../utils/classNames'
// Components
import Avatar from '../Avatar'
import MsgStatusIcon from '../MsgStatusIcon'
import ChatSidebarItemDropDown from './ChatSidebarItemDropDown'
// Enum
import { ChatListItemType } from '../../types/index.types'

export interface StackedListItemProps {
  roomId: number
  alias: string | null
  active: number | null
  dp: string | null
  latestMsg: ChatListItemType['latestMsg']
  onClick: () => void
}

const ChatSidebarItem = ({ roomId, alias, active, dp, latestMsg, onClick }: StackedListItemProps) => {
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
          roomId === active ? 'bg-gray-700/90' : 'hover:bg-gray-600/40',
        )}
        onClick={onClick}
      >
        <span className="absolute inset-0" />
        <Avatar src={dp} />

        <div className="ml-4 py-3 w-full border-b border-gray-700">
          <div className="flex justify-between items-center">
            {/* If the user, with whom the chat is, is not in contacts, then show [Unknown] */}
            <p className="text-base text-gray-50">{alias ?? '[Unknown]'}</p>
            {latestMsg && (
              <p className="text-xs text-gray-400 flex items-end">
                <span>{format(parseISO(latestMsg.createdAt), 'h:mm a')}</span>
              </p>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p
              className={classNames(
                'flex items-center text-sm text-gray-400 space-x-1 line-clamp-1',
                latestMsg === null ? 'h-5' : '', // same as line-height of 'text-sm'
              )}
            >
              {latestMsg?.status && <MsgStatusIcon status={latestMsg.status} />}
              {latestMsg && <span>{latestMsg.content}</span>}
            </p>
            <ChatSidebarItemDropDown menuItems={menuItems} />
          </div>
        </div>
      </div>
    </li>
  )
}
export default memo(ChatSidebarItem)

import { memo } from 'react'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import shallow from 'zustand/shallow'
// Utils
import classNames from '../../utils/classNames'
// Custom Hooks
import { useFetch } from '../../hooks/useFetch'
// Components
import Avatar from '../Avatar'
import MsgStatusIcon from '../MsgStatusIcon'
import RoomItemDropDown from './RoomItemDropDown'
// Store
import { useStore } from '../../stores/index.store'
// Types
import type { ChatListItemType } from '../../types/index.types'

export interface RoomItemProps {
  roomId: number
  alias: string | null
  dp: string | null
  latestMsg: ChatListItemType['latestMsg']
  archived?: boolean
  onClick: () => void
}

const RoomItem = ({ roomId, alias, dp, latestMsg, archived = false, onClick }: RoomItemProps) => {
  const fetchHook = useFetch()

  const [activeRoom, archiveRoom, unarchiveRoom] = useStore(
    state => [state.activeRoom, state.archiveRoom, state.unarchiveRoom],
    shallow,
  )
  const menuItems = [
    {
      slot: !archived ? 'Archive chat' : 'Unarchive chat',
      onClick() {
        if (!archived) {
          archiveRoom(roomId)
          fetchHook(`user-to-room/archive/${roomId}`, { method: 'PATCH' })
        } else {
          unarchiveRoom(roomId)
          fetchHook(`user-to-room/unarchive/${roomId}`, { method: 'PATCH' })
        }
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
    ...(() =>
      !archived
        ? [
            {
              slot: 'Pin chat',
              onClick() {
                console.log('clicked')
              },
            },
          ]
        : [])(),
    {
      slot: 'Mark as unread',
      onClick() {
        console.log('clicked')
      },
    },
  ]

  function getDateTime() {
    // FIXME: relative time
    const diff = differenceInCalendarDays(new Date(), new Date(latestMsg!.createdAt))

    if (diff < 1) return format(parseISO(latestMsg!.createdAt), 'h:mm a')
    if (diff === 1) return 'Yesterday'
    return format(parseISO(latestMsg!.createdAt), 'h:mm a')
  }

  return (
    <li>
      <div
        className={classNames(
          'px-3 w-full text-left flex items-center relative',
          roomId === activeRoom?.id ? 'bg-gray-700/90' : 'hover:bg-gray-600/40',
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
                <span>{getDateTime()}</span>
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
            <RoomItemDropDown menuItems={menuItems} />
          </div>
        </div>
      </div>
    </li>
  )
}
export default memo(RoomItem)

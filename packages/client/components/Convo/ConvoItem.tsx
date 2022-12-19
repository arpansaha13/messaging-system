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
// Icons
import { Icon } from '@iconify/react'
import pinIcon from '@iconify-icons/mdi/pin'
// Store
import { useStore } from '../../stores/index.store'
// Types
import type { ConvoItemType } from '../../types/index.types'

export interface ConvoItemProps {
  roomId: number
  alias: string | null
  dp: string | null
  latestMsg: ConvoItemType['latestMsg']
  archived?: boolean
  pinned?: boolean
  onClick: () => void
}

const ConvoItem = ({ roomId, alias, dp, latestMsg, archived = false, pinned = false, onClick }: ConvoItemProps) => {
  const fetchHook = useFetch()

  // Initially no rooms would be active - so `activeRoom` may be null
  const [
    activeRoom,
    setActiveRoom,
    setActiveChatInfo,
    archiveRoom,
    unarchiveRoom,
    deleteChat,
    deleteConvo,
    pinConvo,
    unpinConvo,
  ] = useStore(
    state => [
      state.activeRoom,
      state.setActiveRoom,
      state.setActiveChatInfo,
      state.archiveRoom,
      state.unarchiveRoom,
      state.deleteChat,
      state.deleteConvo,
      state.pinConvo,
      state.unpinConvo,
    ],
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
        deleteChat(roomId)
        deleteConvo(roomId, archived)
        // If active room is being deleted
        if (activeRoom && activeRoom.id === roomId) {
          setActiveRoom(null)
          setActiveChatInfo(null)
        }
        fetchHook(`user-to-room/${roomId}/delete-chat`, { method: 'DELETE' })
      },
    },
    ...(() =>
      !archived
        ? [
            {
              slot: !pinned ? 'Pin chat' : 'Unpin chat',
              onClick() {
                if (!pinned) {
                  pinConvo(roomId)
                  fetchHook(`user-to-room/${roomId}/pin-chat`, { method: 'PATCH' })
                } else {
                  unpinConvo(roomId)
                  fetchHook(`user-to-room/unarchive/${roomId}`, { method: 'PATCH' })
                }
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
    const diff = differenceInCalendarDays(new Date(), new Date(latestMsg!.createdAt))

    if (diff < 1) return format(parseISO(latestMsg!.createdAt), 'h:mm a')
    if (diff === 1) return 'Yesterday'
    return format(parseISO(latestMsg!.createdAt), 'dd/MM/yy')
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
            <div className="flex-shrink-0 flex items-center">
              {pinned && <Icon icon={pinIcon} color="#9ca3af" width={20} height={20} />}
              <RoomItemDropDown menuItems={menuItems} />
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
export default memo(ConvoItem)

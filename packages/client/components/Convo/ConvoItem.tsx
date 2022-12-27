import { memo } from 'react'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import shallow from 'zustand/shallow'
// Utils
import { classNames, isUnread } from '../../utils'
// Custom Hooks
import { useFetch } from '../../hooks/useFetch'
// Components
import Avatar from '../common/Avatar'
import MsgStatusIcon from '../MsgStatusIcon'
import RoomItemDropDown from './RoomItemDropDown'
// Icons
import { Icon } from '@iconify/react'
import pinIcon from '@iconify-icons/mdi/pin'
// Stores
import { useAuthStore } from '../../stores/useAuthStore'
import { useStore } from '../../stores/index.store'
// Types
import type { ConvoItemType } from '../../types/index.types'

export interface ConvoItemProps {
  roomId: number
  alias: string | null
  dp: string | null
  displayName: string
  latestMsg: ConvoItemType['latestMsg']
  archived?: boolean
  pinned?: boolean
  onClick: () => void
}

const ConvoItem = ({
  roomId,
  alias,
  dp,
  displayName,
  latestMsg,
  archived = false,
  pinned = false,
  onClick,
}: ConvoItemProps) => {
  const fetchHook = useFetch()

  const authUser = useAuthStore(state => state.authUser)!
  const [
    activeRoom,
    setActiveRoom,
    setActiveChatInfo,
    archiveRoom,
    unarchiveRoom,
    deleteChat,
    deleteConvo,
    updateConvoPin,
  ] = useStore(
    state => [
      // Initially no rooms would be active - so `activeRoom` may be null
      state.activeRoom,
      state.setActiveRoom,
      state.setActiveChatInfo,
      state.archiveRoom,
      state.unarchiveRoom,
      state.deleteChat,
      state.deleteConvo,
      state.updateConvoPin,
    ],
    shallow,
  )
  let authUserIsSender = authUser.id === latestMsg?.senderId
  let unread = isUnread(authUser.id, latestMsg)

  const menuItems = [
    {
      slot: !archived ? 'Archive chat' : 'Unarchive chat',
      onClick() {
        if (!archived) {
          archiveRoom(roomId, fetchHook)
        } else {
          unarchiveRoom(roomId, fetchHook)
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
        deleteChat(roomId, fetchHook)
        deleteConvo(roomId, archived)
        // If active room is being deleted
        if (activeRoom && activeRoom.id === roomId) {
          setActiveRoom(null)
          setActiveChatInfo(null)
        }
      },
    },
    ...(() =>
      !archived
        ? [
            {
              slot: !pinned ? 'Pin chat' : 'Unpin chat',
              onClick() {
                if (!pinned) {
                  updateConvoPin(roomId, true, fetchHook)
                } else {
                  updateConvoPin(roomId, false, fetchHook)
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
          unread ? 'font-semibold' : '',
        )}
        onClick={onClick}
      >
        <span className="absolute inset-0" />
        <Avatar src={dp} />

        <div className="ml-4 py-3 w-full border-b border-gray-700">
          <div className="flex justify-between items-center">
            <p className="text-base text-gray-50">{alias ?? <span className="italic">{`~${displayName}`}</span>}</p>
            {latestMsg && (
              <p className={classNames('text-xs flex items-end', unread ? 'text-emerald-600' : 'text-gray-400')}>
                <span>{getDateTime()}</span>
              </p>
            )}
          </div>
          <div className="flex justify-between items-center text-gray-400">
            <p
              className={classNames(
                'flex items-center text-sm space-x-1 line-clamp-1',
                latestMsg === null ? 'h-5' : '', // same as line-height of 'text-sm'
              )}
            >
              {latestMsg && authUserIsSender && <MsgStatusIcon status={latestMsg.status} />}
              {latestMsg && <span>{latestMsg.content}</span>}
            </p>
            <div className="flex-shrink-0 flex items-center">
              {pinned && <Icon icon={pinIcon} color="inherit" width={20} height={20} />}
              <RoomItemDropDown menuItems={menuItems} />
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
export default memo(ConvoItem)

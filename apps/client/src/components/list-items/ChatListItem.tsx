'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { differenceInCalendarDays, format } from 'date-fns'
import { classNames, isNullOrUndefined } from '@arpansaha13/utils'
import GlobalName from '~/components/GlobalName'
import MsgStatusIcon from '~/components/MsgStatusIcon'
import { Avatar, ContextMenu, ContextMenuWrapper } from '~/components/common'
import isUnread from '~/utils/isUnread'
import { useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import type { IChatListItem, IContextMenuItem } from '@shared/types/client'

interface ChatListItemProps {
  chatListItem: IChatListItem
  children?: React.ReactNode
  menuItems: IContextMenuItem<void>[]
}

export default function ChatListItem(props: Readonly<ChatListItemProps>) {
  const {
    children,
    menuItems,
    chatListItem: { latestMsg, receiver, contact },
  } = props

  const { data: authUser, isSuccess } = useGetAuthUserQuery()

  // If no chat is selected `receiverId` will be null
  const searchParams = useSearchParams()
  const receiverId = useMemo(() => (searchParams.has('to') ? parseInt(searchParams.get('to')!) : null), [searchParams])

  const { authUserIsSender, unread } = useMemo(() => {
    if (isNullOrUndefined(authUser) || isNullOrUndefined(latestMsg)) {
      return { authUserIsSender: false, unread: false }
    }
    return {
      authUserIsSender: authUser.id === latestMsg.senderId,
      unread: isUnread(authUser.id, latestMsg),
    }
  }, [authUser, latestMsg])

  if (!isSuccess) {
    return null
  }

  return (
    <ContextMenuWrapper>
      {({ onContextMenu }) => (
        <li className="relative">
          <Link
            href={{ query: { to: receiver.id } }}
            className={classNames(
              'flex w-full items-center rounded px-3 text-left transition-colors',
              receiver.id === receiverId
                ? 'bg-gray-300/65 hover:bg-gray-400/40 dark:bg-gray-700/80 dark:hover:bg-gray-600/80'
                : 'hover:bg-gray-200/80 dark:hover:bg-gray-600/40',
              unread && 'font-semibold',
            )}
            onContextMenu={onContextMenu}
          >
            <Avatar src={receiver.dp} size={3} />

            <div className="ml-4 w-full py-3">
              <div className="flex items-center justify-between">
                <p className="text-base text-black dark:text-gray-50">
                  {contact?.alias ?? <GlobalName name={receiver.globalName} />}
                </p>
                {latestMsg && (
                  <p
                    className={classNames(
                      'flex items-end text-xs',
                      unread ? 'text-brand-600' : 'text-gray-500 dark:text-gray-400',
                    )}
                  >
                    <span>{getDateTime(latestMsg!.createdAt)}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <p
                  className={classNames(
                    'flex items-center space-x-1 text-sm',
                    latestMsg === null && 'h-5', // same as line-height of 'text-sm'
                  )}
                >
                  {latestMsg && authUserIsSender && <MsgStatusIcon status={latestMsg.status} />}
                  {latestMsg && <span className="line-clamp-1">{latestMsg.content}</span>}
                </p>
                {children && (
                  <div className="flex flex-shrink-0 items-center text-gray-500 dark:text-gray-400">
                    {/* Icons */}
                    {children}
                  </div>
                )}
              </div>
            </div>
          </Link>

          <ContextMenu items={menuItems} />
        </li>
      )}
    </ContextMenuWrapper>
  )
}

function getDateTime(dateString: string) {
  const diff = differenceInCalendarDays(new Date(), new Date(dateString))

  if (diff < 1) return format(dateString, 'h:mm a')
  if (diff === 1) return 'Yesterday'
  return format(dateString, 'dd/MM/yy')
}

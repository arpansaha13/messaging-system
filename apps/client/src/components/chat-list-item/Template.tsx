import { differenceInCalendarDays, format } from 'date-fns'
import { classNames } from '@arpansaha13/utils'
import { Avatar, ContextMenu, ContextMenuWrapper } from '~/components/common'
import GlobalName from '~/components/GlobalName'
import MsgStatusIcon from '~/components/MsgStatusIcon'
import isUnread from '~/utils/isUnread'
import type { IChatListItem, IContextMenuItem } from '@shared/types/client'
import { useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import { useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface ChatListItemTemplateProps {
  userId: number
  alias: string | null
  dp: string | null
  latestMsg: IChatListItem['latestMsg']
  globalName: string
  children?: React.ReactNode
  menuItems: IContextMenuItem[]
}

export default function ChatListItemTemplate(props: Readonly<ChatListItemTemplateProps>) {
  const { userId, alias, dp, latestMsg, globalName, children, menuItems } = props

  const { data: authUser, isSuccess } = useGetAuthUserQuery()

  // If no chat is selected `receiverId` will be null
  const searchParams = useSearchParams()
  const receiverId = useMemo(() => (searchParams.has('to') ? parseInt(searchParams.get('to')!) : null), [searchParams])

  const authUserIsSender = useMemo(() => authUser?.id === latestMsg?.senderId, [authUser, latestMsg?.senderId])
  const unread = useMemo(() => authUser && isUnread(authUser.id, latestMsg), [authUser, latestMsg])

  function getDateTime() {
    const diff = differenceInCalendarDays(new Date(), new Date(latestMsg!.createdAt))

    if (diff < 1) return format(latestMsg!.createdAt, 'h:mm a')
    if (diff === 1) return 'Yesterday'
    return format(latestMsg!.createdAt, 'dd/MM/yy')
  }

  if (!isSuccess) {
    return null
  }

  return (
    <ContextMenuWrapper>
      {({ onContextMenu }) => (
        <li className="relative">
          <Link
            href={{ query: { to: userId } }}
            className={classNames(
              'flex w-full items-center rounded px-3 text-left transition-colors',
              userId === receiverId
                ? 'bg-gray-300/65 hover:bg-gray-400/40 dark:bg-gray-700/80 dark:hover:bg-gray-600/80'
                : 'hover:bg-gray-200/80 dark:hover:bg-gray-600/40',
              unread && 'font-semibold',
            )}
            onContextMenu={onContextMenu}
          >
            <Avatar src={dp} />

            <div className="ml-4 w-full py-3">
              <div className="flex items-center justify-between">
                <p className="text-base text-black dark:text-gray-50">{alias ?? <GlobalName name={globalName} />}</p>
                {latestMsg && (
                  <p
                    className={classNames(
                      'flex items-end text-xs',
                      unread ? 'text-brand-600' : 'text-gray-500 dark:text-gray-400',
                    )}
                  >
                    <span>{getDateTime()}</span>
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
                <div className="flex flex-shrink-0 items-center text-gray-500 dark:text-gray-400">
                  {/* Icons */}
                  {children}
                </div>
              </div>
            </div>
          </Link>

          <ContextMenu items={menuItems} />
        </li>
      )}
    </ContextMenuWrapper>
  )
}

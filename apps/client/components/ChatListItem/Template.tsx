import { shallow } from 'zustand/shallow'
import { differenceInCalendarDays, format } from 'date-fns'
import { classNames } from '@arpansaha13/utils'
import Avatar from '~common/Avatar'
import MsgStatusIcon from '../MsgStatusIcon'
import { useStore } from '~/store'
import { useAuthStore } from '~/store/useAuthStore'
import isUnread from '~/utils/isUnread'
import type { IChatListItem } from '@pkg/types'

interface ChatListItemTemplateProps {
  userId: number
  alias: string | null
  dp: string | null
  latestMsg: IChatListItem['latestMsg']
  globalName: string
  children: React.ReactNode
  onClick: () => void
}

export default function ChatListItemTemplate(props: Readonly<ChatListItemTemplateProps>) {
  const { userId, alias, dp, latestMsg, globalName, children, onClick } = props

  const authUser = useAuthStore(state => state.authUser)!

  // If no chat is selected `activeChat` will be null
  const [activeChat] = useStore(state => [state.activeChat], shallow)

  function getDateTime() {
    const diff = differenceInCalendarDays(new Date(), new Date(latestMsg!.createdAt))

    if (diff < 1) return format(latestMsg!.createdAt, 'h:mm a')
    if (diff === 1) return 'Yesterday'
    return format(latestMsg!.createdAt, 'dd/MM/yy')
  }

  const authUserIsSender = authUser.id === latestMsg?.senderId
  const unread = isUnread(authUser.id, latestMsg)

  return (
    <li>
      <div
        className={classNames(
          'px-3 w-full text-left flex items-center relative rounded',
          userId === activeChat?.receiver.id
            ? 'bg-gray-300/60 dark:bg-gray-700/90'
            : 'hover:bg-gray-200/60 dark:hover:bg-gray-600/40',
          unread ? 'font-semibold' : '',
        )}
        onClick={onClick}
      >
        <span className="absolute inset-0" />
        <Avatar src={dp} />

        <div className="ml-4 py-3 w-full border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <p className="text-base text-black dark:text-gray-50">
              {alias ?? <span className="italic">{`~${globalName}`}</span>}
            </p>
            {latestMsg && (
              <p
                className={classNames(
                  'text-xs flex items-end',
                  unread ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400',
                )}
              >
                <span>{getDateTime()}</span>
              </p>
            )}
          </div>
          <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
            <p
              className={classNames(
                'flex items-center text-sm space-x-1',
                latestMsg === null ? 'h-5' : '', // same as line-height of 'text-sm'
              )}
            >
              {latestMsg && authUserIsSender && <MsgStatusIcon status={latestMsg.status} />}
              {latestMsg && <span className="line-clamp-1">{latestMsg.content}</span>}
            </p>
            <div className="flex-shrink-0 flex items-center text-gray-500 dark:text-gray-400">{children}</div>
          </div>
        </div>
      </div>
    </li>
  )
}

import { shallow } from 'zustand/shallow'
import { differenceInCalendarDays, format } from 'date-fns'
import { classNames } from '@arpansaha13/utils'
import Avatar from '~common/Avatar'
import { ContextMenu, ContextMenuWrapper } from '~common/ContextMenu'
import GlobalName from '~/components/GlobalName'
import MsgStatusIcon from '~/components/MsgStatusIcon'
import { useStore } from '~/store'
import isUnread from '~/utils/isUnread'
import type { IChatListItem, IContextMenuItem } from '@pkg/types'

interface ChatListItemTemplateProps {
  userId: number
  alias: string | null
  dp: string | null
  latestMsg: IChatListItem['latestMsg']
  globalName: string
  children?: React.ReactNode
  menuItems: IContextMenuItem[]
  onClick: (e: React.MouseEvent) => void
}

export default function ChatListItemTemplate(props: Readonly<ChatListItemTemplateProps>) {
  const { userId, alias, dp, latestMsg, globalName, children, menuItems, onClick } = props

  // If no chat is selected `activeChat` will be null
  const [authUser, activeChat] = useStore(state => [state.authUser!, state.activeChat], shallow)

  const authUserIsSender = authUser.id === latestMsg?.senderId
  const unread = isUnread(authUser.id, latestMsg)

  function getDateTime() {
    const diff = differenceInCalendarDays(new Date(), new Date(latestMsg!.createdAt))

    if (diff < 1) return format(latestMsg!.createdAt, 'h:mm a')
    if (diff === 1) return 'Yesterday'
    return format(latestMsg!.createdAt, 'dd/MM/yy')
  }

  return (
    <ContextMenuWrapper>
      {({ onContextMenu }) => (
        <li className="relative">
          <button
            className={classNames(
              'flex w-full items-center rounded px-3 text-left transition-colors',
              userId === activeChat?.receiver.id
                ? 'bg-gray-300/65 hover:bg-gray-400/40 dark:bg-gray-700/80 dark:hover:bg-gray-600/80'
                : 'hover:bg-gray-200/80 dark:hover:bg-gray-600/40',
              unread ? 'font-semibold' : '',
            )}
            onClick={onClick}
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
                      unread ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400',
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
                    latestMsg === null ? 'h-5' : '', // same as line-height of 'text-sm'
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
          </button>

          <ContextMenu items={menuItems} />
        </li>
      )}
    </ContextMenuWrapper>
  )
}

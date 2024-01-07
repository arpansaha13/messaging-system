import { memo } from 'react'
import { format, parseISO } from 'date-fns'
import { classNames } from '@arpansaha13/utils'
import MsgStatusIcon from '../../MsgStatusIcon'
import { useAuthStore } from '~/store/useAuthStore'
import type { MessageType } from '~/types'

interface MessageProps {
  message: MessageType
}

const Message = ({ message }: MessageProps) => {
  const authUser = useAuthStore(state => state.authUser)!
  const authUserIsSender = authUser.id === message.senderId
  return (
    <div
      className={classNames(
        'lg:max-w-lg xl:max-w-xl w-max mb-4 last:mb-0 px-2 pt-1.5 pb-2.5 text-sm rounded-lg text-gray-900 dark:text-gray-100 space-y-1.5 border-b border-gray-400/50 dark:border-none relative',
        authUserIsSender ? 'bg-green-100 dark:bg-emerald-800 ml-auto' : 'bg-white dark:bg-slate-700',
      )}
    >
      <span className="break-words">{message.content}</span>

      <div className="min-w-[4.5rem] text-xs text-gray-800 dark:text-gray-300 inline-flex items-end justify-end">
        <p className="flex items-center absolute right-2 bottom-1">
          <span className="mr-1">{format(parseISO(message.createdAt), 'h:mm a')}</span>
          {authUserIsSender && <MsgStatusIcon status={message.status} />}
        </p>
      </div>
    </div>
  )
}
export default memo(Message)

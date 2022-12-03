import { memo } from 'react'
import { format, parseISO } from 'date-fns'
// Components
import MsgStatusIcon from '../MsgStatusIcon'
// Stores
import { useAuthStore } from '../../stores/useAuthStore'
// Utils
import classNames from '../../utils/classNames'
// Types
import type { MessageType, MsgConfirmedType, MsgSendingType } from '../../types'

interface MessageProps {
  message: MessageType
}

const Message = ({ message }: MessageProps) => {
  const authUser = useAuthStore(state => state.authUser)!
  const authUserMsg = authUser.id === message.senderId
  return (
    <div
      className={classNames(
        'max-w-xl w-max mb-4 last:mb-0 px-2 pt-1.5 pb-2.5 text-sm rounded-lg text-gray-100 space-y-1.5 relative',
        authUserMsg ? 'bg-emerald-800 ml-auto' : 'bg-slate-700',
      )}
    >
      <span className="break-words">{message.content}</span>

      <div className="min-w-[4.5rem] text-xs text-gray-300 inline-flex items-end justify-end">
        <p className="flex items-center absolute right-2 bottom-1">
          <span className="mr-1">{format(parseISO(message.createdAt), 'h:mm a')}</span>
          {authUserMsg && <MsgStatusIcon status={(message as MsgSendingType | MsgConfirmedType).status} />}
        </p>
      </div>
    </div>
  )
}
export default memo(Message)

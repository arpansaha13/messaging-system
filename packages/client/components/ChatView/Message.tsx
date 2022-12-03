import { memo } from 'react'
import { format, parseISO } from 'date-fns'
// Icons
import { ClockIcon, CheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
// Utils
import classNames from '../../utils/classNames'
// Types
import { MessageStatus, MessageType, MsgConfirmedType, MsgSendingType } from '../../types'
import { useAuthStore } from '../../stores/useAuthStore'

interface MessageProps {
  message: MessageType
}

const MsgStatusIcon = (status: MessageStatus) => {
  switch (status) {
    case MessageStatus.SENDING:
      return <ClockIcon className="inline-block w-3 h-3 ml-1 flex-shrink-0" />
    case MessageStatus.SENT:
      return <CheckIcon className="inline-block w-3 h-3 ml-1 flex-shrink-0" />
    // TODO: Find an icon for double-tick and use here
    case MessageStatus.DELIVERED:
      return <CheckCircleIcon className="inline-block w-3 h-3 ml-1 flex-shrink-0" />
    case MessageStatus.READ:
      return <CheckCircleIcon className="inline-block w-3 h-3 ml-1 flex-shrink-0 text-blue-500" />
    default:
      console.error('Invalid message status.')
  }
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

      <p className="min-w-[4.5rem] text-xs text-gray-300 inline-flex items-end justify-end">
        <span className="absolute right-2 bottom-1">
          {format(parseISO(message.createdAt), 'h:mm a')}
          {authUserMsg && MsgStatusIcon((message as MsgSendingType | MsgConfirmedType).status)}
        </span>
      </p>
    </div>
  )
}
export default memo(Message)

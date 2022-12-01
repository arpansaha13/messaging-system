import { memo } from 'react'
import { format } from 'date-fns'
// Icons
import {
  ClockIcon,
  CheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
// Utils
import classNames from '../../utils/classNames'
// Types
import type { MessageType, MsgConfirmedType } from '../../types'

interface MessageProps {
  message: MessageType
}

const MsgStatusIcon = (status: MsgConfirmedType['status'] | 'sending') => {
  switch (status) {
    case 'sending':
      return <ClockIcon className="inline-block w-3 h-3 ml-1 flex-shrink-0" />
    case 'sent':
      return <CheckIcon className="inline-block w-3 h-3 ml-1 flex-shrink-0" />
    // TODO: Find an icon for double-tick and use here
    case 'delivered':
      return (
        <CheckCircleIcon className="inline-block w-3 h-3 ml-1 flex-shrink-0" />
      )
    case 'read':
      return (
        <CheckCircleIcon className="inline-block w-3 h-3 ml-1 flex-shrink-0 text-blue-500" />
      )
    default:
      console.error('Invalid message status.')
  }
}

const Message = ({ message }: MessageProps) => {
  return (
    <div
      className={classNames(
        'max-w-xl w-max mb-4 last:mb-0 px-2 pt-1.5 pb-2.5 text-sm rounded-lg text-gray-100 space-y-1.5 relative',
        message.myMsg ? 'bg-emerald-800 ml-auto' : 'bg-slate-700',
      )}
    >
      <span className="break-words">{message.msg}</span>

      <p className="min-w-[4.5rem] text-xs text-gray-300 inline-flex items-end justify-end">
        <span className="absolute right-2 bottom-1">
          {format(message.time, 'h:mm a')}
          {message.myMsg && MsgStatusIcon(message.status)}
        </span>
      </p>
    </div>
  )
}
export default memo(Message)

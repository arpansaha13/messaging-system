import { memo } from 'react'
import { format } from 'date-fns'
// Icons
import { ClockIcon } from '@heroicons/react/24/outline'
// Utils
import classNames from '../../utils/classNames'
// Types
import type { MessageType } from '../../types'

interface MessageProps {
  message: MessageType
}

function MessageContent({ message }: { message: MessageType }) {
  if (!message.myMsg) {
    return (
      <span className="absolute right-2 bottom-1">
        {format(message.time, 'h:mm a')}
      </span>
    )
  } else if (message.status === 'sending') {
    return (
      <ClockIcon className="absolute right-2 bottom-1 w-3 h-3 flex-shrink-0" />
    )
  } else {
    // TODO: Update this part to include single tick, double tick and blue tick.
    return (
      <span className="absolute right-2 bottom-1">
        {format(message.time, 'h:mm a')}
      </span>
    )
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
      <span>{message.msg}</span>

      <p className="min-w-[4rem] text-xs text-gray-300 inline-flex items-end justify-end">
        {<MessageContent message={message} />}
      </p>
    </div>
  )
}
export default memo(Message)

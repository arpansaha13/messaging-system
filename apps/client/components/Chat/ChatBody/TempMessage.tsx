import { format } from 'date-fns'
import MsgStatusIcon from '../../MsgStatusIcon'
import type { IMessageSending } from '@pkg/types'

interface MessageProps {
  message: IMessageSending
}

const TempMessage = ({ message }: MessageProps) => {
  return (
    <div className="lg:max-w-lg xl:max-w-xl w-max mb-4 last:mb-0 px-2 pt-1.5 pb-2.5 text-sm rounded-lg text-gray-900 dark:text-gray-100 space-y-1.5 border-b border-gray-400/50 dark:border-none relative bg-green-100 dark:bg-emerald-800 ml-auto">
      <span className="break-words">{message.content}</span>

      <div className="min-w-[4.5rem] text-xs text-gray-800 dark:text-gray-300 inline-flex items-end justify-end">
        <p className="flex items-center absolute right-2 bottom-1">
          <span className="mr-1">{format(message.createdInClientAt, 'h:mm a')}</span>
          <MsgStatusIcon status={message.status} />
        </p>
      </div>
    </div>
  )
}

export default TempMessage

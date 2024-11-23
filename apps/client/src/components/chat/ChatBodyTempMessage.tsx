import MsgStatusIcon from '~/components/MsgStatusIcon'
import FormattedDate from './FormattedDate'
import type { IMessageSending } from '@shared/types'

interface TempMessageProps {
  message: IMessageSending
}

export default function TempMessage({ message }: Readonly<TempMessageProps>) {
  return (
    <div className="mb-4 ml-auto w-max">
      <div className="dark:bg-brand-800 relative min-w-full space-y-1.5 rounded-lg border-b border-gray-400/50 bg-green-100 p-2 text-sm text-gray-900 last:mb-0 lg:max-w-lg xl:max-w-xl dark:border-none dark:text-gray-100">
        <p className="break-words">{message.content}</p>
      </div>
      <div className="mt-0.5 flex justify-end">
        <p className="flex min-w-[4.5rem] items-center justify-end gap-1">
          <FormattedDate dateString={message.createdInClientAt} />
          <span className="inline-flex size-4 flex-shrink-0 items-center">
            <MsgStatusIcon status={message.status} />
          </span>
        </p>
      </div>
    </div>
  )
}

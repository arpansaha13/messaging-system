import { classNames } from '@arpansaha13/utils'
import MsgStatusIcon from '~/components/MsgStatusIcon'
import FormattedDate from './FormattedDate'
import type { IMessage } from '@shared/types'

interface MessageProps {
  message: IMessage
  authUserIsSender: boolean
}

export default function Message(props: Readonly<MessageProps>) {
  const { message, authUserIsSender } = props

  return (
    <div className={classNames('mb-4 w-max', authUserIsSender && 'ml-auto')}>
      <div
        className={classNames(
          'relative min-w-full space-y-1.5 rounded-lg border-b border-gray-400/50 p-2 text-sm text-gray-900 last:mb-0 lg:max-w-lg xl:max-w-xl dark:border-none dark:text-gray-100',
          authUserIsSender ? 'dark:bg-brand-800 bg-green-100' : 'bg-white dark:bg-slate-700',
        )}
      >
        <p className="break-words">{message.content}</p>
      </div>
      <div className={classNames('mt-0.5 flex', authUserIsSender && 'justify-end')}>
        <p className={classNames('flex min-w-[4.5rem] items-center gap-1', authUserIsSender && 'justify-end')}>
          <FormattedDate dateString={message.createdAt} />
          <span className="inline-flex size-4 flex-shrink-0 items-center">
            {authUserIsSender && <MsgStatusIcon status={message.status} />}
          </span>
        </p>
      </div>
    </div>
  )
}

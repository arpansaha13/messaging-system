'use client'

import { classNames } from '@arpansaha13/utils'
import { Avatar } from '~/components/common'
import GlobalName from '~/components/GlobalName'
import { useAppSelector } from '~/store/hooks'
import { selectTypingState } from '~/store/features/typing/typing.slice'
import { useChatContext } from './context'
import _fetch from '~/utils/api/_fetch'

const ChatHeader = () => {
  const { data: receiver, isSuccess } = useChatContext()!
  const isTyping = useAppSelector(state => selectTypingState(state, receiver?.id))

  if (!isSuccess) {
    return null
  }

  return (
    <div className="flex items-center space-x-3 text-gray-900 dark:text-gray-400">
      <Avatar src={receiver.dp} height={2.5} width={2.5} />

      <div>
        <p className="font-semibold text-gray-800 dark:text-gray-50">
          {receiver.contact?.alias ?? <GlobalName name={receiver.globalName} />}
        </p>
        <p
          className={classNames(
            'overflow-hidden text-xs transition-[height] duration-200',
            isTyping ? 'h-4' : 'h-0 delay-150',
          )}
        >
          <span className={classNames('transition-opacity', isTyping ? 'opacity-100 delay-200' : 'opacity-0')}>
            typing...
          </span>
        </p>
      </div>
    </div>
  )
}

export default ChatHeader

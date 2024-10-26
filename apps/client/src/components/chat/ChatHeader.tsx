import { classNames } from '@arpansaha13/utils'
import { Avatar } from '~/components/common'

export interface ChatHeaderProps {
  dp: string | null
  name: React.ReactNode
  isTyping: boolean | null
}

const ChatHeader = (props: Readonly<ChatHeaderProps>) => {
  const { dp, name, isTyping } = props

  return (
    <div className="flex items-center space-x-3 text-gray-900 dark:text-gray-400">
      <Avatar src={dp} height={2.5} width={2.5} />

      <div>
        <p className="font-semibold text-gray-800 dark:text-gray-50">{name}</p>
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

ChatHeader.displayName = 'ChatHeader'
export default ChatHeader

import { classNames } from '@arpansaha13/utils'
import Avatar from '~common/Avatar'
import GlobalName from '~/components/GlobalName'
import { useAppSelector } from '~/store/hooks'
import { selectTypingState } from '~/store/features/typing/typing.slice'
import { selectActiveChat } from '~/store/features/chat-list/chat-list.slice'

const ChatHeader = () => {
  const activeChat = useAppSelector(selectActiveChat)!
  const isTyping = useAppSelector(state => selectTypingState(state, activeChat.receiver.id))

  return (
    <>
      <div className="flex items-center space-x-3 text-gray-900 dark:text-gray-400">
        <Avatar src={activeChat.receiver.dp} height={2.5} width={2.5} />

        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-50">
            {activeChat.contact?.alias ?? <GlobalName name={activeChat.receiver.globalName} />}
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
    </>
  )
}

export default ChatHeader

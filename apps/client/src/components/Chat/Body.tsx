import { useEffect, useMemo, useRef } from 'react'
import { differenceInCalendarDays, format } from 'date-fns'
import { classNames, isNullOrUndefined } from '@arpansaha13/utils'
import MsgStatusIcon from '~/components/MsgStatusIcon'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import { selectTempMessagesMap, selectUserMessagesMap, upsertMessages } from '~/store/features/messages/message.slice'
import { useChatContext } from './context'
import { _getMessages } from '~/utils/api'
import type { IMessage, IMessageSending } from '@shared/types'

interface MessageProps {
  message: IMessage
}

interface TempMessageProps {
  message: IMessageSending
}

interface FormattedDateProps {
  dateString: Date | string
}

export default function ChatBody() {
  const elRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()
  const userMessagesMap = useAppSelector(selectUserMessagesMap)
  const tempMessagesMap = useAppSelector(selectTempMessagesMap)
  const { data: receiver, isSuccess } = useChatContext()!

  useEffect(() => {
    if (!isNullOrUndefined(receiver) && !userMessagesMap.has(receiver.id)) {
      _getMessages(receiver.id).then(chatRes => {
        dispatch(
          upsertMessages({
            receiverId: receiver.id,
            newMessages: chatRes,
          }),
        )
      })
    }
  }, [receiver, userMessagesMap, dispatch])

  // Keep scroll position at bottom.
  // Rerun this effect whenever a new message is pushed.
  useEffect(() => {
    if (elRef.current) {
      elRef.current.scrollTo({ top: elRef.current.scrollHeight })
    }
  }, [elRef, userMessagesMap, tempMessagesMap])

  if (!isSuccess) {
    return null
  }

  return (
    <div ref={elRef} className="scrollbar overflow-y-scroll px-20 py-4">
      {userMessagesMap.has(receiver.id) && <Messages />}
    </div>
  )
}

function Messages() {
  const userMessagesMap = useAppSelector(selectUserMessagesMap)
  const tempMessagesMap = useAppSelector(selectTempMessagesMap)
  const { data: receiver } = useChatContext()!

  if (!userMessagesMap.has(receiver.id) && !tempMessagesMap.has(receiver.id)) return null

  const messages = userMessagesMap.get(receiver.id) ?? new Map<string, IMessage>()
  const tempMessages = tempMessagesMap.get(receiver.id) ?? new Map<string, IMessageSending>()

  const messageItr = messages.values()
  const tempMessageItr = tempMessages.values()

  const renderMap: JSX.Element[] = []

  let messageItrResult = messageItr.next()
  let tempMessageItrResult = tempMessageItr.next()

  while (!messageItrResult.done && !tempMessageItrResult.done) {
    const message = messageItrResult.value
    const tempMessage = tempMessageItrResult.value

    if (new Date(message.createdAt) <= tempMessage.createdInClientAt) {
      renderMap.push(<Message key={message.id} message={message} />)
      messageItrResult = messageItr.next()
    } else if (new Date(message.createdAt) < tempMessage.createdInClientAt) {
      renderMap.push(<TempMessage key={tempMessage.hash} message={tempMessage} />)
      tempMessageItrResult = tempMessageItr.next()
    }
  }

  while (!messageItrResult.done) {
    const message = messageItrResult.value

    renderMap.push(<Message key={message.id} message={message} />)
    messageItrResult = messageItr.next()
  }

  while (!tempMessageItrResult.done) {
    const tempMessage = tempMessageItrResult.value

    renderMap.push(<TempMessage key={tempMessage.hash} message={tempMessage} />)
    tempMessageItrResult = tempMessageItr.next()
  }

  return renderMap
}

function Message({ message }: Readonly<MessageProps>) {
  const { data: authUser, isSuccess } = useGetAuthUserQuery()
  const authUserIsSender = useMemo(() => authUser?.id === message.senderId, [authUser, message.senderId])

  if (!isSuccess) {
    return null
  }

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

function TempMessage({ message }: Readonly<TempMessageProps>) {
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

function FormattedDate(props: Readonly<FormattedDateProps>) {
  const { dateString } = props
  const formattedTime = useMemo(() => format(dateString, 'hh:mm a'), [dateString])
  const formattedDate = useMemo(() => {
    const diff = differenceInCalendarDays(new Date(), new Date(dateString))

    if (diff < 1) return 'Today at'
    if (diff === 1) return 'Yesterday at'
    return format(dateString, 'dd/MM/yy')
  }, [dateString])

  return (
    <span className="text-xs text-gray-800 dark:text-gray-400">
      <time>
        {formattedDate} {formattedTime}
      </time>
    </span>
  )
}

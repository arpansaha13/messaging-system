import { useEffect, useRef } from 'react'
import { shallow } from 'zustand/shallow'
import { format } from 'date-fns'
import { classNames } from '@arpansaha13/utils'
import MsgStatusIcon from '~/components/MsgStatusIcon'
import { useStore } from '~/store'
import _fetch from '~/utils/_fetch'
import type { IMessage, IMessageSending } from '@pkg/types'

interface MessageProps {
  message: IMessage
}

interface TempMessageProps {
  message: IMessageSending
}

export default function ChatBody() {
  const elRef = useRef<HTMLDivElement>(null)

  const [userMessagesMap, tempMessagesMap, activeChat, getUserMessagesMap, upsertMessages] = useStore(
    state => [
      state.userMessagesMap,
      state.tempMessagesMap,
      state.activeChat!,
      state.getUserMessagesMap,
      state.upsertMessages,
    ],
    shallow,
  )

  useEffect(() => {
    if (!getUserMessagesMap().has(activeChat.receiver.id)) {
      _fetch(`messages/${activeChat.receiver.id}`).then((chatRes: IMessage[]) => {
        upsertMessages(activeChat.receiver.id, chatRes)
      })
    }
  }, [activeChat, getUserMessagesMap, upsertMessages])

  // Keep scroll position at bottom.
  // Rerun this effect whenever a new message is pushed.
  useEffect(() => {
    if (elRef.current) {
      elRef.current.scrollTo({ top: elRef.current.scrollHeight })
    }
  }, [elRef, userMessagesMap, tempMessagesMap])

  return (
    <div ref={elRef} className="scrollbar overflow-y-scroll px-20 py-4">
      {userMessagesMap.has(activeChat.receiver.id) && <Messages />}
    </div>
  )
}

function Messages() {
  const [userMessagesMap, tempMessagesMap, activeChat] = useStore(
    state => [state.userMessagesMap, state.tempMessagesMap, state.activeChat!],
    shallow,
  )

  if (!userMessagesMap.has(activeChat.receiver.id) && !tempMessagesMap.has(activeChat.receiver.id)) return null

  const messages = userMessagesMap.get(activeChat.receiver.id) ?? new Map<string, IMessage>()
  const tempMessages = tempMessagesMap.get(activeChat.receiver.id) ?? new Map<string, IMessageSending>()

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
  const authUser = useStore(state => state.authUser)!
  const authUserIsSender = authUser.id === message.senderId

  return (
    <div
      className={classNames(
        'relative mb-4 w-max space-y-1.5 rounded-lg border-b border-gray-400/50 px-2 pb-2.5 pt-1.5 text-sm text-gray-900 last:mb-0 lg:max-w-lg xl:max-w-xl dark:border-none dark:text-gray-100',
        authUserIsSender ? 'ml-auto bg-green-100 dark:bg-emerald-800' : 'bg-white dark:bg-slate-700',
      )}
    >
      <span className="break-words">{message.content}</span>

      <div className="inline-flex min-w-[4.5rem] items-end justify-end text-xs text-gray-800 dark:text-gray-300">
        <p className="absolute bottom-1 right-2 flex items-center">
          <span className="mr-1">{format(message.createdAt, 'h:mm a')}</span>
          {authUserIsSender && <MsgStatusIcon status={message.status} />}
        </p>
      </div>
    </div>
  )
}

function TempMessage({ message }: Readonly<TempMessageProps>) {
  return (
    <div className="relative mb-4 ml-auto w-max space-y-1.5 rounded-lg border-b border-gray-400/50 bg-green-100 px-2 pb-2.5 pt-1.5 text-sm text-gray-900 last:mb-0 lg:max-w-lg xl:max-w-xl dark:border-none dark:bg-emerald-800 dark:text-gray-100">
      <span className="break-words">{message.content}</span>

      <div className="inline-flex min-w-[4.5rem] items-end justify-end text-xs text-gray-800 dark:text-gray-300">
        <p className="absolute bottom-1 right-2 flex items-center">
          <span className="mr-1">{format(message.createdInClientAt, 'h:mm a')}</span>
          <MsgStatusIcon status={message.status} />
        </p>
      </div>
    </div>
  )
}

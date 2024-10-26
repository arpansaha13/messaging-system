'use client'

import { useRef, useEffect } from 'react'
import ChatBodyMessage from './ChatBodyMessage'
import ChatBodyTempMessage from './ChatBodyTempMessage'
import type { IUser } from '@shared/types/client'
import type { IMessage, IMessageSending } from '@shared/types'

export interface ChatBodyProps {
  authUserId: IUser['id']
  messages: Map<IMessage['id'], IMessage>
  tempMessages: Map<IMessageSending['hash'], IMessageSending>
}

export default function ChatBody(props: Readonly<ChatBodyProps>) {
  const { authUserId, messages, tempMessages } = props
  const elRef = useRef<HTMLDivElement>(null)

  // Keep scroll position at bottom.
  // Rerun this effect whenever a new message is pushed.
  useEffect(() => {
    if (elRef.current) {
      elRef.current.scrollTo({ top: elRef.current.scrollHeight })
    }
  }, [elRef, messages, tempMessages])

  const messageItr = messages.values()
  const tempMessageItr = tempMessages.values()

  const renderMap: JSX.Element[] = []

  let messageItrResult = messageItr.next()
  let tempMessageItrResult = tempMessageItr.next()

  while (!messageItrResult.done && !tempMessageItrResult.done) {
    const message = messageItrResult.value
    const tempMessage = tempMessageItrResult.value
    const authUserIsSender = authUserId === message.senderId

    if (new Date(message.createdAt) <= tempMessage.createdInClientAt) {
      renderMap.push(<ChatBodyMessage key={message.id} message={message} authUserIsSender={authUserIsSender} />)
      messageItrResult = messageItr.next()
    } else if (new Date(message.createdAt) < tempMessage.createdInClientAt) {
      renderMap.push(<ChatBodyTempMessage key={tempMessage.hash} message={tempMessage} />)
      tempMessageItrResult = tempMessageItr.next()
    }
  }

  while (!messageItrResult.done) {
    const message = messageItrResult.value
    const authUserIsSender = authUserId === message.senderId

    renderMap.push(<ChatBodyMessage key={message.id} message={message} authUserIsSender={authUserIsSender} />)
    messageItrResult = messageItr.next()
  }

  while (!tempMessageItrResult.done) {
    const tempMessage = tempMessageItrResult.value

    renderMap.push(<ChatBodyTempMessage key={tempMessage.hash} message={tempMessage} />)
    tempMessageItrResult = tempMessageItr.next()
  }

  return (
    <div ref={elRef} className="scrollbar overflow-y-scroll px-20 py-4">
      {renderMap}
    </div>
  )
}

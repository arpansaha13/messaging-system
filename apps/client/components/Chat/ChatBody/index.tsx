import { useEffect, useRef } from 'react'
import { shallow } from 'zustand/shallow'
import { useStore } from '~/store'
import Message from './Message'
import TempMessage from './TempMessage'
import _fetch from '~/utils/_fetch'
import type { MessageType, MsgSendingType } from '@pkg/types'

export default function ChatBody() {
  const elRef = useRef<HTMLDivElement>(null)

  const [chats, tempChats, activeChat, getChats, upsertChat] = useStore(
    state => [state.chats, state.tempChats, state.activeChat!, state.getChats, state.upsertChat],
    shallow,
  )

  useEffect(() => {
    if (!getChats().has(activeChat.receiver.id)) {
      _fetch(`messages/${activeChat.receiver.id}`).then((chatRes: MessageType[]) => {
        upsertChat(activeChat.receiver.id, chatRes)
      })
    }
  }, [activeChat])

  // Keep scroll position at bottom.
  // Rerun this effect whenever a new message is pushed. For this, include `chats` and `tempChats` in dependencies.
  useEffect(() => {
    if (elRef.current) {
      elRef.current.scrollTo({ top: elRef.current.scrollHeight })
    }
  }, [elRef, chats, tempChats])

  return (
    <div ref={elRef} className="px-20 py-4 overflow-y-scroll scrollbar">
      {chats.has(activeChat.receiver.id) && <Messages />}
    </div>
  )
}

function Messages() {
  const [chats, tempChats, activeChat] = useStore(state => [state.chats, state.tempChats, state.activeChat!], shallow)

  if (!chats.has(activeChat.receiver.id) && !tempChats.has(activeChat.receiver.id)) return null

  const messages = chats.get(activeChat.receiver.id) ?? new Map<string, MessageType>()
  const tempMessages = tempChats.get(activeChat.receiver.id) ?? new Map<string, MsgSendingType>()

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

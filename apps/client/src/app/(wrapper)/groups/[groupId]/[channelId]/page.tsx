'use client'

import { Chat, ChatHeader, ChatBody, ChatFooter } from '~/components/chat'
import { useController } from './controller'

export default function Page() {
  const {
    authUserId,
    channel,
    messages,
    tempMessages,
    inputValue,
    isGetAuthUserSuccess,
    isGetChannelSuccess,
    handleChange,
    handleKeyDown,
  } = useController()

  if (!isGetAuthUserSuccess || !isGetChannelSuccess) {
    return null
  }

  return (
    <Chat
      header={<ChatHeader dp={null} isTyping={null} name={channel!.name} />}
      body={<ChatBody authUserId={authUserId!} messages={messages} tempMessages={tempMessages} />}
      footer={<ChatFooter value={inputValue} onChange={handleChange} onKeyDown={handleKeyDown} />}
    />
  )
}

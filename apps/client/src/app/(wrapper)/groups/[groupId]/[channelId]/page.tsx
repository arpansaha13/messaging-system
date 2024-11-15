'use client'

import { isNullOrUndefined } from '@arpansaha13/utils'
import { Chat, ChatHeader, ChatBody, ChatFooter } from '~/components/chat'
import { useController } from './controller'

export default function Page() {
  const {
    authUserId,
    channel,
    inputValue,
    groupMessages,
    tempGroupMessages,
    isGetAuthUserSuccess,
    isGetChannelSuccess,
    handleChange,
    handleKeyDown,
  } = useController()

  if (!isGetAuthUserSuccess || !isGetChannelSuccess || isNullOrUndefined(groupMessages)) {
    return null
  }

  return (
    <Chat
      header={<ChatHeader dp={null} isTyping={null} name={channel!.name} />}
      body={<ChatBody authUserId={authUserId!} messages={groupMessages} tempMessages={tempGroupMessages} />}
      footer={<ChatFooter value={inputValue} onChange={handleChange} onKeyDown={handleKeyDown} />}
    />
  )
}

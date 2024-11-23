'use client'

import GlobalName from '~/components/GlobalName'
import { Chat, ChatBody, ChatFooter, ChatHeader } from '~/components/chat'
import { SkeletonChat } from '~/components/skeleton'
import useController from './controller'

export default function PersonalChat() {
  const {
    authUserId,
    receiver,
    isGetUserSuccess,
    isGetAuthUserSuccess,
    isTyping,
    messages,
    tempMessages,
    inputValue,
    handleChange,
    handleKeyDown,
  } = useController()

  if (!isGetUserSuccess || !isGetAuthUserSuccess) {
    return <SkeletonChat />
  }

  return (
    <Chat
      header={
        <ChatHeader
          dp={receiver!.dp}
          isTyping={isTyping}
          name={receiver!.contact?.alias ?? <GlobalName name={receiver!.globalName} />}
        />
      }
      body={<ChatBody authUserId={authUserId!} messages={messages} tempMessages={tempMessages} />}
      footer={<ChatFooter value={inputValue} onChange={handleChange} onKeyDown={handleKeyDown} />}
    />
  )
}

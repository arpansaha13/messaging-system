import { memo, useEffect, useRef, useState } from 'react'
import { useDebounce } from 'react-use'
import { shallow } from 'zustand/shallow'
// import { MicrophoneIcon } from '@heroicons/react/24/solid'
// import { PaperClipIcon, FaceSmileIcon } from '@heroicons/react/24/outline'
import TextArea from './TextArea'
import { useSocket } from '~/hooks/useSocket'
import { useAuthStore } from '~/store/useAuthStore'
import { useStore } from '~/store'
import { generateHash } from '~/utils/generateHash'
import { MessageStatus } from '@pkg/types'
import type { KeyboardEvent } from 'react'
import type { ISenderEmitTyping, MsgSendingType } from '@pkg/types'

const isTypedCharGood = ({ keyCode, metaKey, ctrlKey, altKey }: KeyboardEvent) => {
  if (metaKey || ctrlKey || altKey) return false
  // 0...9
  if (keyCode >= 48 && keyCode <= 57) return true
  // a...z
  if (keyCode >= 65 && keyCode <= 90) return true
  // All other keys.
  return false
}

const ChatFooter = () => {
  const { socket } = useSocket()

  const authUser = useAuthStore(state => state.authUser)!
  const [activeChat, addDraft, drafts, removeDraft, unarchiveRoom, upsertTempChat] = useStore(
    state => [
      state.activeChat!,
      state.addDraft,
      state.drafts,
      state.removeDraft,
      state.unarchiveRoom,
      state.upsertTempChat,
    ],
    shallow,
  )

  const [value, setValue] = useState('')
  const prevReceiverId = useRef(activeChat.receiver.id ?? null)

  function typingPayload(isTyping: boolean): ISenderEmitTyping {
    return {
      senderId: authUser.id,
      receiverId: activeChat.receiver.id,
      isTyping,
    }
  }
  const isFirstRun = useRef(true)
  const [isReady] = useDebounce(
    () => {
      if (isFirstRun.current) {
        isFirstRun.current = false
        return
      }
      socket.emit('typing', typingPayload(false))
    },
    1000,
    [value],
  )

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (isReady() && isTypedCharGood(e)) {
      socket.emit('typing', typingPayload(true))
    }
    if (e.key === 'Enter' && value) {
      unarchiveRoom(activeChat.receiver.id)

      const newMessage = {
        hash: generateHash(),
        content: value,
        senderId: authUser.id,
        status: MessageStatus.SENDING,
      } as MsgSendingType

      // Note: Convo won't be updated for a message that is still "sending"
      upsertTempChat(activeChat.receiver.id, [
        {
          ...newMessage,
          createdInClientAt: new Date(),
        },
      ])

      setValue('')
      socket.emit('send-message', {
        ...newMessage,
        receiverId: activeChat.receiver.id,
      })
    }
  }

  useEffect(() => {
    // Store the draft, if any, when `activeChat` changes
    if (prevReceiverId.current !== null && value) {
      addDraft(prevReceiverId.current, value)
      setValue('')
    }
    // Retrieve the draft, if any
    if (activeChat !== null && drafts.has(activeChat.receiver.id)) {
      setValue(drafts.get(activeChat.receiver.id)!)
      removeDraft(activeChat.receiver.id)
    }
    prevReceiverId.current = activeChat?.receiver.id ?? null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat])

  return (
    <>
      {/* <button className="p-1 btn-icon">
        <FaceSmileIcon className="w-7 h-7 flex-shrink-0" />
      </button>

      <button className="p-2 rounded-full hover:bg-gray-700/70 btn-icon">
        <PaperClipIcon className="w-6 h-6 flex-shrink-0" />
      </button> */}

      <div className="px-1 flex-grow">
        <TextArea value={value} setValue={setValue} onKeyDown={handleKeyDown} />
      </div>

      {/* <button className="p-2 btn-icon">
        <MicrophoneIcon className="w-6 h-6 flex-shrink-0" />
      </button> */}
    </>
  )
}

export default memo(ChatFooter)

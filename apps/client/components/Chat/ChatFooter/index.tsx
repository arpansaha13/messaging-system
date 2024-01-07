import { memo, useEffect, useRef, useState } from 'react'
import { useDebounce } from 'react-use'
import { shallow } from 'zustand/shallow'
// import { MicrophoneIcon } from '@heroicons/react/24/solid'
// import { PaperClipIcon, FaceSmileIcon } from '@heroicons/react/24/outline'
import TextArea from './TextArea'
import { useFetch } from '~/hooks/useFetch'
import { useSocket } from '~/hooks/useSocket'
import { useAuthStore } from '~/store/useAuthStore'
import { useStore } from '~/store'
import { ISODateNow } from '~/utils'
import { MessageStatus } from '~/types'
import type { KeyboardEvent } from 'react'
import type { TypingStateType } from '~/hooks/useSocket'

interface TypingStatePayloadType extends TypingStateType {
  receiverId: number
}

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
  const fetchHook = useFetch()
  const { socket } = useSocket()

  const authUser = useAuthStore(state => state.authUser)!
  const [activeChatInfo, sendMsg, addDraft, drafts, removeDraft, activeRoom, unarchiveRoom, updateConvoItem] = useStore(
    state => [
      state.activeChatInfo!,
      state.sendMsg,
      state.addDraft,
      state.drafts,
      state.removeDraft,
      state.activeRoom,
      state.unarchiveRoom,
      state.updateConvoItem,
    ],
    shallow,
  )

  const [value, setValue] = useState('')
  const prevRoomId = useRef(activeRoom?.id ?? null)

  function typingStatePayload(isTyping: boolean): TypingStatePayloadType {
    return {
      roomId: activeRoom!.id,
      isTyping,
      receiverId: activeChatInfo.user.id,
    }
  }
  const isFirstRun = useRef(true)
  const [isReady] = useDebounce(
    () => {
      if (isFirstRun.current) {
        isFirstRun.current = false
        return
      }
      if (activeRoom !== null) socket.emit('typing-state', typingStatePayload(false))
    },
    1000,
    [value],
  )

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (activeRoom !== null && isReady() && isTypedCharGood(e)) {
      socket.emit('typing-state', typingStatePayload(true))
    }
    if (e.key === 'Enter' && value) {
      const ISOtimestamp = ISODateNow()
      if (activeRoom !== null) {
        if (activeRoom.archived) {
          unarchiveRoom(activeRoom.id, fetchHook)
        }
        const msg = {
          content: value,
          createdAt: ISOtimestamp,
          senderId: authUser.id,
        }
        sendMsg(activeRoom.id, msg)
        updateConvoItem(
          activeRoom.id,
          {
            ...msg,
            status: MessageStatus.SENDING,
          },
          fetchHook,
        )
      }
      setValue('')
      socket.emit('send-message', {
        content: value,
        ISOtime: ISOtimestamp,
        roomId: activeRoom?.id ?? null,
        senderId: authUser.id,
        receiverId: activeChatInfo.user.id,
      })
    }
  }

  useEffect(() => {
    // Store the draft, if any, when `activeRoom` changes
    if (prevRoomId.current !== null && value) {
      addDraft(prevRoomId.current, value)
      setValue('')
    }
    // Retrieve the draft, if any
    if (activeRoom !== null && drafts.has(activeRoom.id)) {
      setValue(drafts.get(activeRoom.id)!)
      removeDraft(activeRoom.id)
    }
    prevRoomId.current = activeRoom?.id ?? null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom])

  return (
    <div className="px-4 py-2.5 w-full flex items-center text-gray-900 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 space-x-1 shadow-[0_-1px_2px_0] shadow-gray-300/20 dark:shadow-none relative z-10">
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
    </div>
  )
}
export default memo(ChatFooter)

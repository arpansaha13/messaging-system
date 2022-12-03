import { memo, useEffect, useRef, useState } from 'react'
import { useDebounce } from 'react-use'
// Icons
import { MicrophoneIcon } from '@heroicons/react/24/solid'
import { PaperClipIcon, FaceSmileIcon } from '@heroicons/react/24/outline'
// Components
import TextArea from './TextArea'
// Custom Hooks
import { useSocket } from '../../hooks/useSocket'
// Stores
import { useAuthStore } from '../../stores/useAuthStore'
import { useChatStore } from '../../stores/useChatStore'
import { useDraftStore } from '../../stores/useDraftStore'
import { useChatListStore } from '../../stores/useChatListStore'
// Utils
import { ISODateNow } from '../../utils/ISODate'
// Enum
import { MessageStatus } from '../../types'
// Types
import type { KeyboardEvent } from 'react'
import type { TypingStateType } from '../../hooks/useSocket'

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
  const authUser = useAuthStore(state => state.authUser)!
  const send = useChatStore(state => state.send)
  const addDraft = useDraftStore(state => state.add)
  const drafts = useDraftStore(state => state.drafts)
  const removeDraft = useDraftStore(state => state.remove)
  const activeChatUserId = useChatListStore(state => state.activeChatUserId)!
  const updateChatListItem = useChatListStore(state => state.updateChatListItem)

  const { socket } = useSocket()

  const [value, setValue] = useState('')
  const prevChatUserId = useRef(activeChatUserId)

  function typingStatePayload(isTyping: boolean): TypingStateType {
    return {
      isTyping,
      senderId: authUser.id,
      receiverId: activeChatUserId,
    }
  }
  const isFirstRun = useRef(true)
  const [isReady] = useDebounce(
    () => {
      if (isFirstRun.current) {
        isFirstRun.current = false
        return
      }
      socket.emit('typing-state', typingStatePayload(false))
    },
    1000,
    [value],
  )

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (isReady() && isTypedCharGood(e)) {
      socket.emit('typing-state', typingStatePayload(true))
    }
    if (e.key === 'Enter' && value) {
      const ISOtimestamp = ISODateNow()
      send(activeChatUserId, authUser.id, value, ISOtimestamp)
      updateChatListItem(activeChatUserId, {
        latestMsg: value,
        status: MessageStatus.SENDING,
        time: ISOtimestamp,
      })
      setValue('')
      socket.emit('send-message', {
        msg: value,
        ISOtime: ISOtimestamp,
        senderId: authUser.id,
        receiverId: activeChatUserId,
      })
    }
  }

  useEffect(() => {
    // Store the draft, if any, when `activeChatUserId` changes
    if (value) {
      addDraft(prevChatUserId.current, value)
      setValue('')
    }
    // Retrieve the draft, if any.
    if (drafts.has(activeChatUserId)) {
      setValue(drafts.get(activeChatUserId)!)
      removeDraft(activeChatUserId)
    }
    prevChatUserId.current = activeChatUserId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatUserId])

  return (
    <div className="px-4 py-2.5 w-full flex items-center text-gray-400 bg-gray-800 space-x-1">
      <button className="p-1 btn-icon">
        <FaceSmileIcon className="w-7 h-7 flex-shrink-0" />
      </button>

      <button className="p-2 rounded-full hover:bg-gray-700/70 btn-icon">
        <PaperClipIcon className="w-6 h-6 flex-shrink-0" />
      </button>

      <div className="px-1 flex-grow">
        <TextArea value={value} setValue={setValue} handleKeyDown={handleKeyDown} />
      </div>

      <button className="p-2 btn-icon">
        <MicrophoneIcon className="w-6 h-6 flex-shrink-0" />
      </button>
    </div>
  )
}
export default memo(ChatFooter)

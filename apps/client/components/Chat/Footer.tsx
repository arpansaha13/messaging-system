import { useEffect, useRef, useState } from 'react'
import { useDebounce } from 'react-use'
import { shallow } from 'zustand/shallow'
import { useSocket } from '~/hooks/useSocket'
import { useAuthStore } from '~/store/useAuthStore'
import { useStore } from '~/store'
import { generateHash } from '~/utils/generateHash'
import { MessageStatus } from '@pkg/types'
import type { ISenderEmitTyping, IMessageSending } from '@pkg/types'

interface TextAreaProps {
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const isTypedCharGood = ({ keyCode, metaKey, ctrlKey, altKey }: React.KeyboardEvent) => {
  if (metaKey || ctrlKey || altKey) return false
  // 0...9
  if (keyCode >= 48 && keyCode <= 57) return true
  // a...z
  if (keyCode >= 65 && keyCode <= 90) return true
  // All other keys.
  return false
}

export default function ChatFooter() {
  const { socket } = useSocket()

  const authUser = useAuthStore(state => state.authUser)!
  const [activeChat, addDraft, drafts, removeDraft, unarchiveChat, upsertTempMessages] = useStore(
    state => [
      state.activeChat!,
      state.addDraft,
      state.drafts,
      state.removeDraft,
      state.unarchiveChat,
      state.upsertTempMessages,
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isReady() && isTypedCharGood(e)) {
      socket.emit('typing', typingPayload(true))
    }
    if (e.key === 'Enter' && value) {
      unarchiveChat(activeChat.receiver.id)

      const newMessage = {
        hash: generateHash(),
        content: value,
        senderId: authUser.id,
        status: MessageStatus.SENDING,
      } as IMessageSending

      // Note: Convo won't be updated for a message that is still "sending"
      upsertTempMessages(activeChat.receiver.id, [
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
    <div className="flex-grow px-1">
      <TextArea value={value} setValue={setValue} onKeyDown={handleKeyDown} />
    </div>
  )
}

function TextArea({ value, setValue, onKeyDown }: TextAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
  }

  // Shift focus to the textarea on every render
  useEffect(() => {
    inputRef.current?.focus()
  })

  return (
    <div>
      <label htmlFor="type-area" className="sr-only">
        Type a message
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id="type-area"
          name="type-area"
          className="block w-full rounded-lg border-none bg-white px-3 py-2.5 text-sm text-gray-500 placeholder-gray-400 shadow focus:border-none focus:outline-none focus:ring-0 dark:bg-gray-700/70 dark:text-gray-200"
          placeholder="Type a message"
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  )
}

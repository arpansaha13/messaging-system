import { useEffect, useRef, useState } from 'react'
import { useDebounce } from 'react-use'
import { useSocket } from '~/providers/SocketProvider'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import { addDraft, removeDraft, selectDraft } from '~/store/features/drafts/draft.slice'
import { upsertTempMessages } from '~/store/features/messages/message.slice'
import { selectActiveChat, unarchiveChat } from '~/store/features/chat-list/chat-list.slice'
import { generateHash } from '~/utils/generateHash'
import { MessageStatus, SocketEmitEvent } from '@shared/types'
import type { ISenderEmitTyping, IMessageSending } from '@shared/types'

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
  const { socket } = useSocket()!

  const dispatch = useAppDispatch()
  const { data: authUser, isSuccess } = useGetAuthUserQuery()
  const activeChat = useAppSelector(selectActiveChat)!
  const draft = useAppSelector(state => selectDraft(state, activeChat.receiver.id))

  const [inputValue, setInputValue] = useState('')
  const prevReceiverId = useRef(activeChat.receiver.id ?? null)

  function typingPayload(isTyping: boolean): ISenderEmitTyping {
    return {
      senderId: authUser!.id,
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
      socket.emit(SocketEmitEvent.TYPING, typingPayload(false))
    },
    1000,
    [inputValue],
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isReady() && isTypedCharGood(e)) {
      socket.emit(SocketEmitEvent.TYPING, typingPayload(true))
    }
    if (e.key === 'Enter' && inputValue) {
      dispatch(unarchiveChat(activeChat.receiver.id))

      const newMessage = {
        hash: generateHash(),
        content: inputValue,
        senderId: authUser!.id,
        status: MessageStatus.SENDING,
      } as IMessageSending

      // Note: Convo won't be updated for a message that is still "sending"
      dispatch(
        upsertTempMessages({
          receiverId: activeChat.receiver.id,
          messages: [{ ...newMessage, createdInClientAt: new Date() }],
        }),
      )

      setInputValue('')
      socket.emit(SocketEmitEvent.SEND_MESSAGE, {
        ...newMessage,
        receiverId: activeChat.receiver.id,
      })
    }
  }

  useEffect(() => {
    // Store the draft, if any, when `activeChat` changes
    if (prevReceiverId.current !== null && inputValue) {
      dispatch(addDraft({ receiverId: prevReceiverId.current, draft: inputValue }))
      setInputValue('')
    }
    // Retrieve the draft, if any
    if (activeChat !== null && draft) {
      setInputValue(draft)
      dispatch(removeDraft(activeChat.receiver.id))
    }
    prevReceiverId.current = activeChat?.receiver.id ?? null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat, dispatch])

  if (!isSuccess) {
    return null
  }

  return (
    <div className="flex-grow px-1">
      <TextArea value={inputValue} setValue={setInputValue} onKeyDown={handleKeyDown} />
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

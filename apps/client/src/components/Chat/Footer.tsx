import { useEffect, useRef, useState } from 'react'
import { useDebounce } from 'react-use'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { useSocket } from '~/providers/SocketProvider'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import { addDraft, removeDraft, selectDraft } from '~/store/features/drafts/draft.slice'
import { upsertTempMessages } from '~/store/features/messages/message.slice'
import { unarchiveChat } from '~/store/features/chat-list/chat-list.slice'
import { useChatContext } from './context'
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
  const { data: authUser, isSuccess: isGetAuthUserSuccess } = useGetAuthUserQuery()
  const { data: receiver, isSuccess: isGetUserSuccess } = useChatContext()!
  const draft = useAppSelector(state => selectDraft(state, receiver?.id))

  const [inputValue, setInputValue] = useState('')
  const prevReceiverId = useRef(receiver?.id ?? null)

  function typingPayload(isTyping: boolean): ISenderEmitTyping {
    return {
      senderId: authUser!.id,
      receiverId: receiver!.id,
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
      dispatch(unarchiveChat(receiver!.id))

      const newMessage = {
        hash: generateHash(),
        content: inputValue,
        senderId: authUser!.id,
        status: MessageStatus.SENDING,
      } as IMessageSending

      // Note: Convo won't be updated for a message that is still "sending"
      dispatch(
        upsertTempMessages({
          receiverId: receiver!.id,
          messages: [{ ...newMessage, createdInClientAt: new Date() }],
        }),
      )

      setInputValue('')
      socket.emit(SocketEmitEvent.SEND_MESSAGE, {
        ...newMessage,
        receiverId: receiver!.id,
      })
    }
  }

  useEffect(() => {
    // Store the draft, if any, when `receiver` changes
    if (!isNullOrUndefined(prevReceiverId.current) && inputValue) {
      dispatch(addDraft({ receiverId: prevReceiverId.current, draft: inputValue }))
      setInputValue('')
    }
    // Retrieve the draft, if any
    if (!isNullOrUndefined(receiver) && draft) {
      setInputValue(draft)
      dispatch(removeDraft(receiver.id))
    }
    prevReceiverId.current = receiver?.id ?? null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiver, dispatch, draft])

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

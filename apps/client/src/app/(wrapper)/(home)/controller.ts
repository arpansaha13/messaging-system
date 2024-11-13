import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useDebounce } from 'react-use'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { useSocket } from '~/hooks/useSocket'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { unarchiveChat } from '~/store/features/chat-list/chat-list.slice'
import { selectDraft, addDraft, removeDraft } from '~/store/features/drafts/draft.slice'
import {
  getMessages,
  upsertTempMessages,
  selectUserMessagesMap,
  selectTempMessagesMap,
} from '~/store/features/messages/message-personal.slice'
import { selectTypingState } from '~/store/features/typing/typing.slice'
import { useGetUserQuery, useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import { generateHash } from '~/utils/generateHash'
import { MessageStatus, SocketEvents } from '@shared/constants'
import type { IMessage, IMessageSending, ISenderEmitTyping } from '@shared/types'

export default function useController() {
  const { socket } = useSocket()

  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const receiverId = useMemo(() => parseInt(searchParams.get('to')!), [searchParams])
  const { data: receiver, isSuccess: isGetUserSuccess } = useGetUserQuery(receiverId)
  const { data: authUser, isSuccess: isGetAuthUserSuccess } = useGetAuthUserQuery()
  const isTyping = useAppSelector(state => selectTypingState(state, receiver?.id))!

  // _________________________________FOOTER____________________________________
  const draft = useAppSelector(state => selectDraft(state, receiver?.id))
  const [inputValue, setInputValue] = useState('')
  const prevReceiverId = useRef(receiver?.id ?? null)

  const typingPayload = useCallback(
    (isTyping: boolean): ISenderEmitTyping => {
      return {
        senderId: authUser!.id,
        receiverId: receiver!.id,
        isTyping,
      }
    },
    [authUser, receiver],
  )
  const isFirstRun = useRef(true)
  const [isReady] = useDebounce(
    () => {
      if (isFirstRun.current) {
        isFirstRun.current = false
      } else {
        socket?.emit(SocketEvents.PERSONAL.TYPING, typingPayload(false))
      }
    },
    1000,
    [inputValue, socket],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isNullOrUndefined(socket)) return

      if (isReady() && isTypedCharGood(e)) {
        socket.emit(SocketEvents.PERSONAL.TYPING, typingPayload(true))
      }
      if (e.key === 'Enter' && inputValue) {
        dispatch(unarchiveChat(receiver!.id))

        const newMessage = {
          hash: generateHash(),
          content: inputValue,
          senderId: authUser!.id,
          status: MessageStatus.SENDING,
        } as IMessageSending

        // Note: Chat-list latest-message won't be updated for a message that is still "sending"
        dispatch(
          upsertTempMessages({
            receiverId: receiver!.id,
            messages: [{ ...newMessage, createdInClientAt: new Date() }],
          }),
        )

        setInputValue('')
        socket.emit(SocketEvents.PERSONAL.MESSAGE_SEND, {
          ...newMessage,
          receiverId: receiver!.id,
        })
      }
    },
    [authUser, dispatch, inputValue, isReady, receiver, socket, typingPayload],
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
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

  // __________________________________BODY_____________________________________
  const userMessagesMap = useAppSelector(selectUserMessagesMap)
  const tempMessagesMap = useAppSelector(selectTempMessagesMap)

  const messages = useMemo(() => {
    if (receiver && userMessagesMap.has(receiver.id)) return userMessagesMap.get(receiver.id)!
    return new Map<IMessage['id'], IMessage>()
  }, [receiver, userMessagesMap])

  const tempMessages = useMemo(() => {
    if (receiver && tempMessagesMap.has(receiver.id)) return tempMessagesMap.get(receiver.id)!
    return new Map<IMessageSending['hash'], IMessageSending>()
  }, [receiver, tempMessagesMap])

  useEffect(() => {
    if (!isNullOrUndefined(receiver) && !userMessagesMap.has(receiver.id)) {
      dispatch(getMessages(receiver.id))
    }
  }, [receiver, userMessagesMap, dispatch])

  return {
    authUserId: authUser?.id,
    receiver,
    isGetUserSuccess,
    isGetAuthUserSuccess,
    isTyping,
    messages,
    tempMessages,
    inputValue,
    handleChange,
    handleKeyDown,
  }
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

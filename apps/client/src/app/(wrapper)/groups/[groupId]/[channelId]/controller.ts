import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { MessageStatus, SocketEvents } from '@shared/constants'
import { useSocket } from '~/hooks/useSocket'
import { useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import {
  getGroupMessages,
  selectGroupMessages,
  selectTempGroupMessages,
  upsertTempGroupMessages,
} from '~/store/features/messages/message-group.slice'
import { useGetChannelQuery } from '~/store/features/channels/channels.api.slice'
import { generateHash } from '~/utils/generateHash'
import type { IGroupMessageSending } from '@shared/types'

export function useController() {
  const { socket } = useSocket()

  const params = useParams()
  const dispatch = useAppDispatch()
  const { data: authUser, isSuccess: isGetAuthUserSuccess } = useGetAuthUserQuery()
  const groupId = useMemo(() => parseInt(params.groupId as string), [params.groupId])
  const channelId = useMemo(() => parseInt(params.channelId as string), [params.channelId])
  const { data: channel, isSuccess: isGetChannelSuccess } = useGetChannelQuery(channelId)
  const [inputValue, setInputValue] = useState('')

  // _________________________________FOOTER____________________________________

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isNullOrUndefined(socket)) return

      if (e.key === 'Enter' && inputValue) {
        const newMessage = {
          hash: generateHash(),
          content: inputValue,
          senderId: authUser!.id,
          status: MessageStatus.SENDING,
        } as IGroupMessageSending

        // Note: Chat-list latest-message won't be updated for a message that is still "sending"
        dispatch(
          upsertTempGroupMessages({
            channelId,
            messages: [{ ...newMessage, createdInClientAt: new Date().toString() }],
          }),
        )

        setInputValue('')
        socket.emit(SocketEvents.GROUP.MESSAGE_SEND, {
          ...newMessage,
          groupId,
          channelId,
        })
      }
    },
    [authUser, channelId, dispatch, groupId, inputValue, socket],
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
  }

  // __________________________________BODY_____________________________________

  const groupMessages = useAppSelector(state => selectGroupMessages(state, channelId))
  const tempGroupMessages = useAppSelector(state => selectTempGroupMessages(state, channelId)) ?? new Map()

  useEffect(() => {
    if (isNullOrUndefined(groupMessages)) {
      dispatch(getGroupMessages(channelId))
    }
  }, [channelId, groupMessages, dispatch])

  return {
    authUserId: authUser?.id,
    channel,
    groupMessages,
    tempGroupMessages,
    inputValue,
    isGetChannelSuccess,
    isGetAuthUserSuccess,
    handleChange,
    handleKeyDown,
  }
}

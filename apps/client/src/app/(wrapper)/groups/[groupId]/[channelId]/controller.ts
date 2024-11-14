import { useCallback, useMemo, useState } from 'react'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { useSocket } from '~/hooks/useSocket'
import { useGetAuthUserQuery } from '~/store/features/users/users.api.slice'
import { useAppSelector } from '~/store/hooks'
import { selectGroupMessagesMap, selectTempGroupMessagesMap } from '~/store/features/messages/message-group.slice'
import { useGetChannelQuery } from '~/store/features/channels/channels.api.slice'
import { useParams } from 'next/navigation'

export function useController() {
  const { socket } = useSocket()

  const { data: authUser, isSuccess: isGetAuthUserSuccess } = useGetAuthUserQuery()
  const params = useParams()
  const channelId = useMemo(() => parseInt(params.channelId as string), [params.channelId])
  const { data: channel, isSuccess: isGetChannelSuccess } = useGetChannelQuery(channelId)
  const [inputValue, setInputValue] = useState('')

  // _________________________________FOOTER____________________________________

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isNullOrUndefined(socket)) return

      if (e.key === 'Enter' && inputValue) {
      }
    },
    [inputValue, socket],
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
  }

  // __________________________________BODY_____________________________________

  const groupMessagesMap = useAppSelector(selectGroupMessagesMap)
  const tempGroupMessagesMap = useAppSelector(selectTempGroupMessagesMap)

  const messages = useMemo(() => {
    if (channel && groupMessagesMap.has(channel.id)) return groupMessagesMap.get(channel.id)!
    return new Map()
  }, [channel, groupMessagesMap])

  const tempMessages = useMemo(() => {
    if (channel && tempGroupMessagesMap.has(channel.id)) return tempGroupMessagesMap.get(channel.id)!
    return new Map()
  }, [channel, tempGroupMessagesMap])

  return {
    authUserId: authUser?.id,
    channel,
    messages,
    tempMessages,
    inputValue,
    isGetChannelSuccess,
    isGetAuthUserSuccess,
    handleChange,
    handleKeyDown,
  }
}

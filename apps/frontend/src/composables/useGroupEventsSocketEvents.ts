import { SocketEvents } from '~/constants'
import type { SocketEventPayloads, IChannel  } from '~/types'

import { useSocket } from './useSocket'

export function useGroupEventsSocketEvents() {
  if (!import.meta.client) {
    return
  }

  const route = useRoute()

  const currentGroupId = computed(() => {
    const group = route.params.groupId
    if (!group) return null
    return Number(Array.isArray(group) ? group[0] : group)
  })

  const socketState = useSocket()
  const logger = useLogger('useGroupEventsSocketEvents')

  watchEffect(onCleanup => {
    if (!socketState.socket.ready.value) {
      return
    }

    const handleNewChannel = (payload: SocketEventPayloads['Group']['OnNewChannel']) => {
      const { id, name, groupId } = payload
      // Only process if we're in the same group
      if (!currentGroupId.value || groupId !== currentGroupId.value) {
        return
      }

      const newChannel: IChannel = {
        id,
        name,
      }

      const { data: channelsData } = useNuxtData<IChannel[]>(asyncKeys.groupChannels(groupId))

      if (channelsData.value) {
        // Add new channel if it doesn't exist
        if (!channelsData.value.some(c => c.id === id)) {
          channelsData.value.push(newChannel)
        }
      }

      logger.info(`New channel created: ${name} (${id}) in group ${groupId}`)
    }

    socketState.socket.on(SocketEvents.GROUP.NEW_CHANNEL, handleNewChannel)

    onCleanup(() => {
      socketState.socket.off(SocketEvents.GROUP.NEW_CHANNEL, handleNewChannel)
    })
  })
}

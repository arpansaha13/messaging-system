import { SocketEvents } from '~/constants'
import type { SocketEventPayloads, IChannel  } from '~/types'

export async function useGroupEventsSocketEvents() {
  if (!import.meta.client) {
    return
  }

  const route = useRoute()
  const { socket } = await useSocket()

  const currentGroupId = computed(() => {
    const group = route.params.groupId
    if (!group) return null
    return Number(Array.isArray(group) ? group[0] : group)
  })

  watchEffect(onCleanup => {
    const connection = socket.value
    if (!connection) {
      return
    }

    const handleNewChannel = (payload: SocketEventPayloads.Group.OnNewChannel) => {
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

      console.log(`New channel created: ${name} (${id}) in group ${groupId}`)
    }

    connection.on(SocketEvents.GROUP.NEW_CHANNEL, handleNewChannel)

    onCleanup(() => {
      connection.off(SocketEvents.GROUP.NEW_CHANNEL, handleNewChannel)
    })
  })
}

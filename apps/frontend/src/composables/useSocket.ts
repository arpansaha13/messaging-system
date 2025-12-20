import type { Ref } from 'vue'
import { io, type Socket } from 'socket.io-client'

export interface SocketWrapper {
  socket: Ref<Socket | null>
  closeSocket: () => void
}

export async function useSocket(): Promise<SocketWrapper> {
  const socket = useState<Socket | null>('socket:instance', () => null)

  if (import.meta.client) {
    const { data: authUser } = await useFetchAuthUser()
    const runtimeConfig = useRuntimeConfig()
    const socketBaseUrl = runtimeConfig.public.socketIoBaseUrl ?? ''

    watchEffect(() => {
      const user = authUser.value
      if (socket.value || !user) {
        return
      }

      socket.value = io(socketBaseUrl, {
        withCredentials: true,
        query: {
          userId: user.id,
          groups: user.groups.join(','),
          channels: user.channels.join(','),
        },
      })
    })
  }

  function closeSocket() {
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
  }

  return {
    socket,
    closeSocket,
  }
}

import type { IUser, IContact, IChatsResponse } from '~/types'
import { SocketEvents } from '@shared/constants'
import type { SocketEventPayloads } from '@shared/types'

export function useOnlineStatusStore() {
  const onlineStatusState = useState<Map<IUser['id'], boolean>>('onlineStatus', () => new Map())
  const initialized = useState<boolean>('onlineStatusStore:initialized', () => false)

  // Initialize periodic fetching and response handler once
  if (import.meta.client && !initialized.value) {
    initialized.value = true
    initializePeriodicFetching()
    setupResponseHandler()
  }

  function setOnlineStatus(receiverId: IUser['id'], isOnline: boolean) {
    const next = new Map(onlineStatusState.value)
    next.set(receiverId, isOnline)
    onlineStatusState.value = next
  }

  function setBatchOnlineStatus(statuses: Record<number, boolean>) {
    const next = new Map(onlineStatusState.value)
    Object.entries(statuses).forEach(([userId, isOnline]) => {
      next.set(Number(userId), isOnline)
    })
    onlineStatusState.value = next
  }

  function getOnlineStatus(receiverId?: IUser['id']) {
    if (!receiverId) {
      return false
    }
    return onlineStatusState.value.get(receiverId) ?? false
  }

  return {
    setOnlineStatus,
    setBatchOnlineStatus,
    getOnlineStatus,
  }
}

function initializePeriodicFetching() {
  const route = useRoute()
  const FETCH_INTERVAL_MS = 12000 // 12 seconds
  const VISIBILITY_DEBOUNCE_MS = 2000 // 2 seconds debounce for visibility changes

  let intervalId: NodeJS.Timeout | null = null
  let visibilityDebounceTimer: NodeJS.Timeout | null = null
  let isPageVisible = true

  if (typeof document !== 'undefined') {
    isPageVisible = document.visibilityState === 'visible'
  }

  function handleVisibilityChange() {
    if (typeof document === 'undefined') return

    const nowVisible = document.visibilityState === 'visible'

    // Clear any pending debounce timer
    if (visibilityDebounceTimer) {
      clearTimeout(visibilityDebounceTimer)
      visibilityDebounceTimer = null
    }

    if (isPageVisible && !nowVisible) {
      isPageVisible = false
      stopFetching()
      return
    }

    // If going from hidden to visible, debounce before starting
    // Prevent frequent visibility changes from triggering the fetch frequently
    if (!isPageVisible && nowVisible) {
      visibilityDebounceTimer = setTimeout(() => {
        isPageVisible = true
        startFetching()
        visibilityDebounceTimer = null
      }, VISIBILITY_DEBOUNCE_MS)
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  function extractUserIdsFromRoute(): number[] {
    const userIds = new Set<number>()

    const path = route.path

    const { data: chatList } = useNuxtData<IChatsResponse>(asyncKeys.chatList)
    const { data: contacts } = useNuxtData<Record<string, IContact[]>>(asyncKeys.contacts)

    // Extract userIds based on route
    if (path === '/') {
      if (chatList.value?.unarchived) {
        chatList.value.unarchived.forEach(item => {
          userIds.add(item.receiver.id)
        })
      }
    } else if (path === '/archived') {
      if (chatList.value?.archived) {
        chatList.value.archived.forEach(item => {
          userIds.add(item.receiver.id)
        })
      }
    } else if (path === '/contacts') {
      if (contacts.value) {
        Object.values(contacts.value)
          .flat()
          .forEach(contact => {
            userIds.add(contact.userId)
          })
      }
    }

    // Include currently opened chat (from query param "to")
    const to = route.query.to
    if (to) {
      const receiverId = Number(Array.isArray(to) ? to[0] : to)
      if (!Number.isNaN(receiverId)) {
        userIds.add(receiverId)
      }
    }

    return Array.from(userIds)
  }

  async function fetchOnlineStatuses() {
    if (!isPageVisible) {
      return
    }

    const { socket } = await useSocket()
    if (!socket.value) {
      return
    }

    const userIds = extractUserIdsFromRoute()
    if (userIds.length === 0) {
      return
    }

    socket.value.emit(SocketEvents.PERSONAL.CHECK_ONLINE, {
      userIds,
    })
  }

  function startFetching() {
    stopFetching() // Clear any existing interval
    fetchOnlineStatuses() // Fetch immediately
    intervalId = setInterval(fetchOnlineStatuses, FETCH_INTERVAL_MS)
  }

  function stopFetching() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  // Start fetching on initialization if page is visible
  if (isPageVisible) {
    startFetching()
  }

  // Cleanup on unmount
  // if (import.meta.client) {
  //   onBeforeUnmount(() => {
  //     stopFetching()
  //     if (visibilityDebounceTimer) {
  //       clearTimeout(visibilityDebounceTimer)
  //     }
  //     if (typeof document !== 'undefined') {
  //       document.removeEventListener('visibilitychange', handleVisibilityChange)
  //     }
  //   })
  // }
}

function setupResponseHandler() {
  if (!import.meta.client) {
    return
  }

  watchEffect(async onCleanup => {
    const { socket } = await useSocket()
    if (!socket.value) {
      return
    }

    const handleCheckOnlineResponse = (payload: SocketEventPayloads.Personal.OnCheckOnline) => {
      const store = useOnlineStatusStore()
      store.setBatchOnlineStatus(payload.statuses)
    }

    socket.value.on(SocketEvents.PERSONAL.CHECK_ONLINE_RESPONSE, handleCheckOnlineResponse)

    onCleanup(() => {
      if (socket.value) {
        socket.value.off(SocketEvents.PERSONAL.CHECK_ONLINE_RESPONSE, handleCheckOnlineResponse)
      }
    })
  })
}

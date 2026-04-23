import { ref, type Ref } from 'vue'
import type { SocketEventPayloads, IChatListItem, IContact } from '~/types'
import { SocketEvents } from '~/constants'

export class Socket {
  public readonly ready: Ref<boolean> = ref(false)
  private _ws: WebSocket | null = null
  private _listeners: Map<string, Set<(data: any) => void>> = new Map()
  private _retryTimeoutId: ReturnType<typeof setTimeout> | null = null
  private _isShutdown = false
  private _userId: number | null = null
  private _onAuthRefreshNeeded?: () => void

  constructor() {}

  public initialize(
    userId: number,
    onAuthRefreshNeeded?: () => void,
    attempt = 0,
    maxAttempts = 10,
    baseDelay = 1000,
    maxDelay = 5000,
  ) {
    if (this._isShutdown) {
      this._isShutdown = false
    }

    if (
      this._userId === userId &&
      (this._ws?.readyState === WebSocket.CONNECTING || this._ws?.readyState === WebSocket.OPEN)
    ) {
      return
    }

    this._userId = userId
    this._onAuthRefreshNeeded = onAuthRefreshNeeded

    if (this._ws) {
      this._ws.close(4000, 'intentional')
      this._ws = null
    }

    if (this._retryTimeoutId) {
      clearTimeout(this._retryTimeoutId)
      this._retryTimeoutId = null
    }

    this._connectOnce(attempt, maxAttempts, baseDelay, maxDelay)
  }

  public shutdown() {
    this._isShutdown = true
    this.ready.value = false
    this._userId = null
    this._onAuthRefreshNeeded = undefined

    if (this._retryTimeoutId) {
      clearTimeout(this._retryTimeoutId)
      this._retryTimeoutId = null
    }

    if (this._ws) {
      this._ws.close(4000, 'intentional')
      this._ws = null
    }
  }

  public on(event: string, handler: (data: any) => void) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set())
    }
    this._listeners.get(event)!.add(handler)
  }

  public off(event: string, handler: (data: any) => void) {
    this._listeners.get(event)?.delete(handler)
  }

  public emit(event: string, data: any) {
    if (this.ready.value && this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify({ event, data }))
    }
  }

  private _connectOnce(attempt: number, maxAttempts: number, baseDelay: number, maxDelay: number) {
    if (this._isShutdown || !this._userId) return

    const logger = useLogger('Socket')
    this._ws = new WebSocket(`/ws/socket`)

    this._ws.onmessage = event => {
      try {
        const frame = JSON.parse(event.data as string) as { event: string; data: unknown }
        this._listeners.get(frame.event)?.forEach(fn => fn(frame.data))
      } catch {
        // malformed frame — ignore
      }
    }

    this._ws.onopen = () => {
      logger.debug('Socket connected successfully')
      this.ready.value = true
    }

    this._ws.onerror = err => {
      logger.error('Socket connection error', err)
    }

    this._ws.onclose = event => {
      this.ready.value = false
      logger.debug('Socket disconnected', { code: event.code, reason: event.reason })

      if (this._isShutdown || event.code === 4000) return

      if (attempt >= maxAttempts) {
        logger.info('Max reconnection attempts reached, refreshing auth')
        this._onAuthRefreshNeeded?.()
        return
      }

      const base = Math.min(baseDelay * 2 ** attempt, maxDelay)
      const jitter = Math.random() * base * 0.2
      const delay = base + jitter

      this._retryTimeoutId = setTimeout(() => {
        this._retryTimeoutId = null
        this._connectOnce(attempt + 1, maxAttempts, baseDelay, maxDelay)
      }, delay)
    }
  }
}

export class OnlineStore {
  private _state = ref<Map<number, boolean>>(new Map())
  private _intervalId: ReturnType<typeof setInterval> | null = null
  private _visibilityDebounceTimer: ReturnType<typeof setTimeout> | null = null
  private _isPageVisible = true
  private _socket: Socket
  private _initialized = false

  constructor(socket: Socket) {
    this._socket = socket
    // this._handleVisibilityChange = this._handleVisibilityChange.bind(this)
    // this._handleCheckOnlineResponse = this._handleCheckOnlineResponse.bind(this)
    // this.getOnlineStatus = this.getOnlineStatus.bind(this)
  }

  public initialize() {
    if (this._initialized) return
    this._initialized = true

    if (typeof document !== 'undefined') {
      this._isPageVisible = document.visibilityState === 'visible'
      document.addEventListener('visibilitychange', this._handleVisibilityChange)
    }

    this._socket.on(SocketEvents.PERSONAL.CHECK_ONLINE_RESPONSE, this._handleCheckOnlineResponse)

    if (this._isPageVisible) {
      this._startFetching()
    }
  }

  public shutdown() {
    if (!this._initialized) return
    this._initialized = false

    this._stopFetching()
    if (this._visibilityDebounceTimer) {
      clearTimeout(this._visibilityDebounceTimer)
      this._visibilityDebounceTimer = null
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._handleVisibilityChange)
    }

    this._socket.off(SocketEvents.PERSONAL.CHECK_ONLINE_RESPONSE, this._handleCheckOnlineResponse)
  }

  public getOnlineStatus(receiverId?: number) {
    if (!receiverId) return false
    return this._state.value.get(receiverId) ?? false
  }

  private _handleCheckOnlineResponse(payload: SocketEventPayloads['Personal']['OnCheckOnline']) {
    const next = new Map(this._state.value)
    Object.entries(payload.statuses).forEach(([userId, isOnline]) => {
      next.set(Number(userId), isOnline as boolean)
    })
    this._state.value = next
  }

  private _handleVisibilityChange() {
    if (typeof document === 'undefined') return

    const nowVisible = document.visibilityState === 'visible'

    if (this._visibilityDebounceTimer) {
      clearTimeout(this._visibilityDebounceTimer)
      this._visibilityDebounceTimer = null
    }

    if (this._isPageVisible && !nowVisible) {
      this._isPageVisible = false
      this._stopFetching()
      return
    }

    if (!this._isPageVisible && nowVisible) {
      this._visibilityDebounceTimer = setTimeout(() => {
        this._isPageVisible = true
        this._startFetching()
        this._visibilityDebounceTimer = null
      }, 2000)
    }
  }

  private _startFetching() {
    this._stopFetching()
    this._fetchOnlineStatuses()
    this._intervalId = setInterval(() => this._fetchOnlineStatuses(), 12000)
  }

  private _stopFetching() {
    if (this._intervalId) {
      clearInterval(this._intervalId)
      this._intervalId = null
    }
  }

  private _extractUserIdsFromRoute(): number[] {
    const route = useRoute()
    const userIds = new Set<number>()
    const path = route.path

    const { data: unarchivedChats } = useNuxtData<IChatListItem[]>(asyncKeys.chatListUnarchived)
    const { data: archivedChats } = useNuxtData<IChatListItem[]>(asyncKeys.chatListArchived)
    const { data: contacts } = useNuxtData<Record<string, IContact[]>>(asyncKeys.contacts)

    if (path === '/') {
      unarchivedChats.value?.forEach(item => userIds.add(item.receiver.id))
    } else if (path === '/archived') {
      archivedChats.value?.forEach(item => userIds.add(item.receiver.id))
    } else if (path === '/contacts') {
      if (contacts.value) {
        Object.values(contacts.value)
          .flat()
          .forEach(contact => userIds.add(contact.userId))
      }
    }

    const to = route.query.to
    if (to) {
      const receiverId = Number(Array.isArray(to) ? to[0] : to)
      if (!Number.isNaN(receiverId)) {
        userIds.add(receiverId)
      }
    }

    return Array.from(userIds)
  }

  private _fetchOnlineStatuses() {
    if (!this._isPageVisible || !this._socket.ready.value) return

    const userIds = this._extractUserIdsFromRoute()
    if (userIds.length === 0) return

    this._socket.emit(SocketEvents.PERSONAL.CHECK_ONLINE, { userIds })
  }
}

const createNoopSocket = (): Socket => {
  // const logger = useLogger('NoopSocket')
  return {
    ready: ref(false),
    initialize: () => {}, // logger.warn('initialize called on noop Socket'),
    shutdown: () => {}, // logger.warn('shutdown called on noop Socket'),
    on: () => {}, // logger.warn('on called on noop Socket'),
    off: () => {}, // logger.warn('off called on noop Socket'),
    emit: () => {}, // logger.warn('emit called on noop Socket'),
  } as unknown as Socket
}

const createNoopOnlineStore = (): OnlineStore => {
  // const logger = useLogger('NoopOnlineStore')
  return {
    initialize: () => {}, // logger.warn('initialize called on noop OnlineStore'),
    shutdown: () => {}, // logger.warn('shutdown called on noop OnlineStore'),
    getOnlineStatus: () => {
      // logger.warn('getOnlineStatus called on noop OnlineStore')
      return false
    },
  } as unknown as OnlineStore
}

let singletonSocket: Socket | null = null
let singletonOnlineStore: OnlineStore | null = null

export function useSocket() {
  const state = shallowReactive({
    socket: createNoopSocket(),
    onlineStore: createNoopOnlineStore(),
  })

  onMounted(() => {
    if (!singletonSocket) {
      singletonSocket = new Socket()
      singletonOnlineStore = new OnlineStore(singletonSocket)
    }
    state.socket = singletonSocket
    state.onlineStore = singletonOnlineStore!
  })

  return state
}

import type { IGroupMessage, IChannel  } from '~/types'

interface PaginatedGroupMessagesResponse {
  messages: IGroupMessage[]
  hasBefore: boolean
  hasAfter: boolean
}

export function useFetchGroupMessages(
  channelId: ComputedRef<IChannel['id'] | null>,
  scrollEl: MaybeRefOrGetter<HTMLElement | null>,
) {
  const hasBefore = useState(() => false)
  const hasAfter = useState(() => false)

  const asyncResult = useAsyncData(
    () => asyncKeys.groupMessages(channelId.value ?? 0),
    async () => {
      if (!channelId.value) return []
      const { $api } = useNuxtApp()
      const res = await $api<PaginatedGroupMessagesResponse>(`/api/channels/${channelId.value}/messages`)
      hasBefore.value = res.hasBefore
      hasAfter.value = res.hasAfter
      return res.messages
    },
    { deep: true },
  )

  async function loadBefore() {
    if (asyncResult.pending.value) return
    const msgs = asyncResult.data.value
    if (!msgs?.length || !channelId.value) return
    const minId = Math.min(...msgs.map((m: IGroupMessage) => m.id))
    const { $api } = useNuxtApp()
    const res = await $api<PaginatedGroupMessagesResponse>(`/api/channels/${channelId.value}/messages?before=${minId}`)
    hasBefore.value = res.hasBefore
    asyncResult.data.value = [...res.messages, ...msgs]
  }

  async function loadAfter() {
    if (asyncResult.pending.value) return
    const msgs = asyncResult.data.value
    if (!msgs?.length || !channelId.value) return
    const maxId = Math.max(...msgs.map((m: IGroupMessage) => m.id))
    const { $api } = useNuxtApp()
    const res = await $api<PaginatedGroupMessagesResponse>(`/api/channels/${channelId.value}/messages?after=${maxId}`)
    hasAfter.value = res.hasAfter
    asyncResult.data.value = [...msgs, ...res.messages]
  }

  const { reset: resetBefore } = useInfiniteScroll(scrollEl, loadBefore, {
    direction: 'top',
    canLoadMore: () => hasBefore.value,
    distance: 200,
  })

  const { reset: resetAfter } = useInfiniteScroll(scrollEl, loadAfter, {
    direction: 'bottom',
    canLoadMore: () => hasAfter.value,
    distance: 200,
  })

  watch(channelId, () => {
    hasBefore.value = false
    hasAfter.value = false
    resetBefore()
    resetAfter()
  })

  return asyncResult
}

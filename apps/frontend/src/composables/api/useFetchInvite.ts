import type { MaybeRef } from 'vue'
import type { IInvite } from '~/types'
import { fetchInvite } from '~/services/invites'

export function useFetchInvite(hash: MaybeRef<string | null | undefined>) {
  const hashRef = computed(() => unref(hash) ?? null)

  return useAsyncData(
    () => (hashRef.value ? asyncKeys.inviteByHash(hashRef.value) : `${asyncKeys.inviteByHash('')}:empty`),
    () => {
      if (!hashRef.value) {
        return Promise.resolve(null as IInvite | null)
      }
      return fetchInvite(hashRef.value)
    },
    {
      immediate: false,
      watch: [hashRef],
      default: () => null as IInvite | null,
    },
  )
}

import type { Slice } from '~/store/types.store'

export interface DraftStoreType {
  /** List of all drafts, mapped with their respective receiver_id. */
  drafts: Map<number, string>

  addDraft: (receiverId: number, draft: string) => void

  removeDraft: (receiverId: number) => void
}

/** Store for the draft messages that were not sent or removed. */
export const useDraftStore: Slice<DraftStoreType> = set => ({
  drafts: new Map<number, string>(),
  addDraft(receiverId: number, draft: string) {
    set((state: DraftStoreType) => {
      state.drafts.set(receiverId, draft)
    })
  },
  removeDraft(receiverId: number) {
    set((state: DraftStoreType) => {
      state.drafts.delete(receiverId)
    })
  },
})

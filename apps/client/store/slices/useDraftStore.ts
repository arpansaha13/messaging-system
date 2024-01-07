import type { Slice } from '~/store/types.store'

export interface DraftStoreType {
  /** List of all drafts, mapped with their respective room_id. */
  drafts: Map<number, string>

  addDraft: (roomId: number, draft: string) => void

  removeDraft: (roomId: number) => void
}

/** Store for the draft messages that were not sent or removed. */
export const useDraftStore: Slice<DraftStoreType> = set => ({
  drafts: new Map<number, string>(),
  addDraft(roomId: number, draft: string) {
    set((state: DraftStoreType) => {
      state.drafts.set(roomId, draft)
    })
  },
  removeDraft(roomId: number) {
    set((state: DraftStoreType) => {
      state.drafts.delete(roomId)
    })
  },
})

import type { Slice } from '~/store/types.store'
import type { DraftSliceType } from './types'

/** Store for the draft messages that were not sent or removed. */
export const draftSlice: Slice<DraftSliceType> = set => ({
  drafts: new Map<number, string>(),
  addDraft(receiverId: number, draft: string) {
    set(state => {
      state.drafts.set(receiverId, draft)
    })
  },
  removeDraft(receiverId: number) {
    set(state => {
      state.drafts.delete(receiverId)
    })
  },
})

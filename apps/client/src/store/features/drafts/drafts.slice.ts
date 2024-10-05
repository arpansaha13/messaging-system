import type { Slice } from '~/store/types.store'
import type { DraftSliceType } from './types'

/** Store for the draft messages that were not sent or removed. */
export const draftSlice: Slice<DraftSliceType> = set => ({
  drafts: new Map(),
  addDraft(receiverId, draft) {
    set(state => {
      state.drafts.set(receiverId, draft)
    })
  },
  removeDraft(receiverId) {
    set(state => {
      state.drafts.delete(receiverId)
    })
  },
})

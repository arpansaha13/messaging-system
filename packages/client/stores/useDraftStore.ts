import create from 'zustand'

interface DraftStoreType {
  /** List of all drafts, mapped with their respective userTags (chats). */
  drafts: Map<number, string>

  /** Add a draft. */
  add: (userId: number, draft: string) => void

  /** Remove a draft. */
  remove: (userId: number) => void
}

/** Store for the draft messages that were not sent or removed. */
export const useDraftStore = create<DraftStoreType>()(set => ({
  drafts: new Map<number, string>(),
  add(userId: number, draft: string) {
    set(state => ({ drafts: state.drafts.set(userId, draft) }))
  },
  remove(userId: number) {
    set(state => {
      const tempDrafts = state.drafts
      tempDrafts.delete(userId)
      return { drafts: tempDrafts }
    })
  },
}))

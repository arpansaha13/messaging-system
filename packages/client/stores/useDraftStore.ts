import create from 'zustand'

interface DraftStoreType {
  /** List of all drafts, mapped with their respective userTags (chats). */
  drafts: Map<string, string>

  /** Add a draft. */
  add: (userTag: string, draft: string) => void

  /** Remove a draft. */
  remove: (userTag: string) => void
}

/** Store for the draft messages that were not sent or removed. */
export const useDraftStore = create<DraftStoreType>()(
  (set) => ({
    drafts: new Map<string, string>(),
    add(userTag: string, draft: string) {
      set(state => ({ drafts: state.drafts.set(userTag, draft) }))
    },
    remove(userTag: string) {
      set(state => {
        const tempDrafts = state.drafts
        tempDrafts.delete(userTag)
        return { drafts: tempDrafts }
      })
    },
  }),
)

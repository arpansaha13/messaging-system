import create from 'zustand'

interface DraftStoreType {
  /** List of all drafts, mapped with their respective room_id. */
  drafts: Map<number, string>

  /** Add a draft. */
  add: (roomId: number, draft: string) => void

  /** Remove a draft. */
  remove: (roomId: number) => void
}

/** Store for the draft messages that were not sent or removed. */
export const useDraftStore = create<DraftStoreType>()(set => ({
  drafts: new Map<number, string>(),
  add(roomId: number, draft: string) {
    set(state => ({ drafts: state.drafts.set(roomId, draft) }))
  },
  remove(roomId: number) {
    set(state => {
      const tempDrafts = state.drafts
      tempDrafts.delete(roomId)
      return { drafts: tempDrafts }
    })
  },
}))

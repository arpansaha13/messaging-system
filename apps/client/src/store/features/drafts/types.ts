export interface DraftSliceType {
  /** List of all drafts, mapped with their respective receiver_id. */
  drafts: Map<number, string>

  addDraft: (receiverId: number, draft: string) => void

  removeDraft: (receiverId: number) => void
}

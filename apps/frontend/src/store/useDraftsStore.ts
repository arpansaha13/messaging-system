import type { IUser } from '~/types'

export function useDraftsStore() {
  const drafts = useState<Map<IUser['id'], string>>('drafts', () => new Map())

  function setDraft(receiverId: IUser['id'], draft: string) {
    const next = new Map(drafts.value)
    next.set(receiverId, draft)
    drafts.value = next
  }

  function removeDraft(receiverId: IUser['id']) {
    if (!drafts.value.has(receiverId)) {
      return
    }
    const next = new Map(drafts.value)
    next.delete(receiverId)
    drafts.value = next
  }

  function getDraft(receiverId?: IUser['id']) {
    if (!receiverId) {
      return null
    }
    return drafts.value.get(receiverId) ?? null
  }

  return {
    setDraft,
    removeDraft,
    getDraft,
  }
}

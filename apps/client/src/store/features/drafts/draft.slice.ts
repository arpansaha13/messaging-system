import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { IUser } from '@shared/types/client'

export interface DraftSliceType {
  drafts: Map<IUser['id'], string>
}

const initialState: DraftSliceType = {
  drafts: new Map(),
}

export const draftSlice = createSlice({
  name: 'draft',
  initialState,
  reducers: {
    addDraft: (state, action: PayloadAction<{ receiverId: IUser['id']; draft: string }>) => {
      state.drafts.set(action.payload.receiverId, action.payload.draft)
    },
    removeDraft: (state, action: PayloadAction<IUser['id']>) => {
      state.drafts.delete(action.payload)
    },
  },
  selectors: {
    selectDraft: (slice, receiverId?: IUser['id']) => (receiverId ? slice.drafts.get(receiverId) : null),
  },
})

export const { addDraft, removeDraft } = draftSlice.actions
export const { selectDraft } = draftSlice.selectors

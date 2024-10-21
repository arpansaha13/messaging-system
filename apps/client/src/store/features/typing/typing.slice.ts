import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { IUser } from '@shared/types/client'

interface TypingSliceType {
  typingState: Map<IUser['id'], boolean>
}

const initialState: TypingSliceType = {
  typingState: new Map(),
}

export const typingSlice = createSlice({
  name: 'typing',
  initialState,
  reducers: {
    setTypingState: (state, action: PayloadAction<{ receiverId: IUser['id']; newState: boolean }>) => {
      state.typingState.set(action.payload.receiverId, action.payload.newState)
    },
  },
  selectors: {
    selectTypingState: (slice, userId?: IUser['id']) => (userId ? slice.typingState.get(userId) : null),
  },
})

export const { setTypingState } = typingSlice.actions
export const { selectTypingState } = typingSlice.selectors

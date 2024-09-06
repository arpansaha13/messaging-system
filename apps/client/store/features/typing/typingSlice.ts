import type { Slice } from '~/store/types.store'
import type { TypingSliceType } from './types'

export const typingSlice: Slice<TypingSliceType> = set => ({
  typingState: {},
  setTypingState(receiverId, newState) {
    set(state => {
      state.typingState[receiverId] = newState
    })
  },
})

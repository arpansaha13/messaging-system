import type { Slice } from '~/store/types.store'

export interface TypingStateType {
  typingState: { [receiverId: number]: boolean }
  setTypingState: (receiverId: number, newState: boolean) => void
}

export const useTypingState: Slice<TypingStateType> = set => ({
  typingState: {},
  setTypingState(receiverId, newState) {
    set((state: TypingStateType) => {
      state.typingState[receiverId] = newState
    })
  },
})

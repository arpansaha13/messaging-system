import type { Slice } from '~/stores/types.store'

export interface TypingStateType {
  typingState: { [roomId: number]: boolean }
  setTypingState: (senderId: number, newState: boolean) => void
}

export const useTypingState: Slice<TypingStateType> = set => ({
  typingState: {},
  setTypingState(roomId, newState) {
    set((state: TypingStateType) => {
      state.typingState[roomId] = newState
    })
  },
})

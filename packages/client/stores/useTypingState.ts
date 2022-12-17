import type { StateCreator } from 'zustand'
import produce from 'immer'

export interface TypingStateType {
  typingState: { [roomId: number]: boolean }
  setTypingState: (senderId: number, newState: boolean) => void
}

export const useTypingState: StateCreator<TypingStateType, [], [], TypingStateType> = set => ({
  typingState: {},
  setTypingState(roomId, newState) {
    set(
      produce((state: TypingStateType) => {
        state.typingState[roomId] = newState
      }),
    )
  },
})

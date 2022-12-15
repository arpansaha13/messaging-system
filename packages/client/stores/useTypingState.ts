import create from 'zustand'
import produce from 'immer'

interface TypingStateType {
  typingState: { [roomId: number]: boolean }
  setTyping: (senderId: number, newState: boolean) => void
}

export const useTypingState = create<TypingStateType>()(set => ({
  typingState: {},
  setTyping(roomId, newState) {
    set(
      produce((state: TypingStateType) => {
        state.typingState[roomId] = newState
      }),
    )
  },
}))

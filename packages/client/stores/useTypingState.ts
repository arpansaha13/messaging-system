import create from 'zustand'
import produce from 'immer'

interface TypingStateType {
  typingState: { [key: number]: boolean }
  setTyping: (senderId: number, newState: boolean) => void
}

export const useTypingState = create<TypingStateType>()(set => ({
  typingState: {},
  setTyping(senderId, newState) {
    set(
      produce((state: TypingStateType) => {
        state.typingState[senderId] = newState
      }),
    )
  },
}))

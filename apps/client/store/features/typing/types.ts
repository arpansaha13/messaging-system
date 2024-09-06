export interface TypingSliceType {
  typingState: { [receiverId: number]: boolean }
  setTypingState: (receiverId: number, newState: boolean) => void
}

import type { StateCreator } from 'zustand'

export type Slice<T> = StateCreator<T, [['zustand/immer', never]], []>

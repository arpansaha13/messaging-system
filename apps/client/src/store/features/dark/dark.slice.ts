import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface DarkState {
  isDark: boolean | null
}

const initialState: DarkState = {
  isDark: null,
}

export const darkModeSlice = createSlice({
  name: 'dark',
  initialState,
  reducers: {
    toggleDark: (state, action: PayloadAction<boolean | undefined>) => {
      if (typeof action.payload !== 'undefined') {
        state.isDark = action.payload
      } else {
        state.isDark = !state.isDark
      }
    },
    setDarkState: (state, action: PayloadAction<boolean>) => {
      state.isDark = action.payload
    },
  },
})

export const { toggleDark, setDarkState } = darkModeSlice.actions

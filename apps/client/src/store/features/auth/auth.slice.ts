import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { IAuthUser } from '@shared/types/client'

interface IAuthSlice {
  authUser: IAuthUser | null
}

const initialState: IAuthSlice = {
  authUser: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser: (state, action: PayloadAction<IAuthUser | null>) => {
      state.authUser = action.payload
    },
  },
  selectors: {
    selectAuthUser: slice => slice.authUser,
  },
})

export const { setAuthUser } = authSlice.actions
export const { selectAuthUser } = authSlice.selectors

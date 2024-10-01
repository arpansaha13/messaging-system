import type { Slice } from '~/store/types.store'
import type { AuthSliceType } from './types'

export const authSlice: Slice<AuthSliceType> = set => ({
  authUser: null,
  setAuthUser(authUser) {
    set({ authUser })
  },
})

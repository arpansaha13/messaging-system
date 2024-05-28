import { createWithEqualityFn } from 'zustand/traditional'
import type { IAuthUser } from '@pkg/types'

interface AuthStoreType {
  authUser: IAuthUser | null
  setAuthUser: (authUser: IAuthUser | null) => void
}

export const useAuthStore = createWithEqualityFn<AuthStoreType>()(set => ({
  authUser: null,
  setAuthUser(authUser) {
    set({ authUser })
  },
}))

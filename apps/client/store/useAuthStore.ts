import { createWithEqualityFn } from 'zustand/traditional'
import type { AuthUserType } from '~/types'

interface AuthStoreType {
  authUser: AuthUserType | null
  setAuthUser: (authUser: AuthUserType | null) => void
}

export const useAuthStore = createWithEqualityFn<AuthStoreType>()(set => ({
  authUser: null,
  setAuthUser(authUser) {
    set({ authUser })
  },
}))

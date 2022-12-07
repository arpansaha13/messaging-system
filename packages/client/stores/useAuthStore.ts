import create from 'zustand'
import { persist } from 'zustand/middleware'
// Types
import type { AuthUserType } from '../types/index.types'

interface AuthStoreType {
  authToken: string | null
  expiresAt: number | null
  authUser: AuthUserType | null
  setAuthUser: (authUser: AuthUserType | null) => void
  setAuthState: (newState: Pick<AuthStoreType, 'authToken' | 'expiresAt'>) => void
  resetAuthState: () => void
}
/** Auth token will be stored/persisted in local storage and this AuthStore reads and updates the data in local storage. */
export const useAuthStore = create<AuthStoreType>()(
  persist(
    set => ({
      authToken: null,
      expiresAt: null,
      authUser: null,
      setAuthUser(authUser) {
        set({ authUser })
      },
      setAuthState(newState) {
        set({
          authToken: newState.authToken,
          expiresAt: newState.expiresAt,
        })
      },
      resetAuthState() {
        set({
          authToken: null,
          expiresAt: null,
        })
      },
    }),
    {
      name: 'auth-store',
      getStorage: () => localStorage,
    },
  ),
)

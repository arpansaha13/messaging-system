import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthUserType } from '../types'

interface AuthStoreType {
  authToken: string | null
  authExpiresAt: number | null
  authUser: AuthUserType | null
  setAuthUser: (authUser: AuthUserType | null) => void
  setAuthState: (newState: Pick<AuthStoreType, 'authToken' | 'authExpiresAt'>) => void
  resetAuthState: () => void
}
/** Auth token will be stored/persisted in local storage and this AuthStore reads and updates the data in local storage. */
export const useAuthStore = create<AuthStoreType>()(
  persist(
    set => ({
      authToken: null,
      authExpiresAt: null,
      authUser: null,
      setAuthUser(authUser) {
        set({ authUser })
      },
      setAuthState(newState) {
        set({
          authToken: newState.authToken,
          authExpiresAt: newState.authExpiresAt,
        })
      },
      resetAuthState() {
        set({
          authToken: null,
          authExpiresAt: null,
          authUser: null,
        })
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

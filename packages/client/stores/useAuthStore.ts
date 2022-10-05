import create from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStoreType {
  authToken: string | null
  expiresAt: number | null
  setAuthState: (newState: Pick<AuthStoreType, 'authToken' | 'expiresAt'>) => void
  resetAuthState: () => void
}
/** Auth token will be stored/persisted in local storage and this AuthStore reads and updates the data in local storage. */
export const useAuthStore = create<AuthStoreType>()(
  persist(
    (set) => ({
      authToken: null,
      expiresAt: null,
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
      }
    }),
    {
      name: 'auth-store',
      getStorage: () => localStorage,
    }
  )
)

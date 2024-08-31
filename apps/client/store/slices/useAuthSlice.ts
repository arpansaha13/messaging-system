import type { IAuthUser } from '@shared/types'
import type { Slice } from '~/store/types.store'

export interface AuthStoreType {
  authUser: IAuthUser | null
  setAuthUser: (authUser: IAuthUser | null) => void
}

export const useAuthStore: Slice<AuthStoreType> = set => ({
  authUser: null,
  setAuthUser(authUser) {
    set({ authUser })
  },
})

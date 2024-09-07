import type { IAuthUser } from '@shared/types/client'

export interface AuthSliceType {
  authUser: IAuthUser | null
  setAuthUser: (authUser: IAuthUser | null) => void
}

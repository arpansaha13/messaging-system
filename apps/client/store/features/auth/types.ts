import type { IAuthUser } from '@shared/types'

export interface AuthSliceType {
  authUser: IAuthUser | null
  setAuthUser: (authUser: IAuthUser | null) => void
}

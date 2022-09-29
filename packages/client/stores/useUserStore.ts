import create from 'zustand'
import { devtools } from 'zustand/middleware'

import type { UserDataType } from '../types'

interface UserStoreType {
  /** List of all users with whom the logged-in user chats, mapped with their respective userTags. */
  users: Map<string, UserDataType>

  /** Initialize the user list. */
  init: (initUsers: UserDataType[]) => void
}

export const useUserStore = create<UserStoreType>()(
  devtools(
    (set) => ({
      users: new Map<string, UserDataType>(),
      init(initUsers: UserDataType[]) {
        set(() => {
          const newUsersMap = new Map<string, UserDataType>()

          for (const user of initUsers) {
            newUsersMap.set(user.userTag, user)
          }

          return {users: newUsersMap}
        })
      },
    }),
  )
)

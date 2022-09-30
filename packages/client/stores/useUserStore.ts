import create from 'zustand'

import type { UserDataType } from '../types'

interface UserStoreType {
  /** List of all users with whom the logged-in user chats, mapped with their respective userTags. */
  users: Map<string, UserDataType>

  /**
   * Initialize the users map.
   * @param initUsers Array of users. This array will be stored in the state as a Map object.
   */
  init: (initUsers: UserDataType[]) => void
}

export const useUserStore = create<UserStoreType>()(
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

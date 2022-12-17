import shallow from 'zustand/shallow'
// Custom Hooks
import { useFetch } from './useFetch'
// Stores
import { useStore } from '../stores/index.store'
import { useAuthStore } from '../stores/useAuthStore'
// Types
import type {
  AuthUserResType,
  ContactResType,
  UserToRoomResType,
  ChatListItemType,
  MsgResType,
  UserType,
} from '../types/index.types'

export function useAppDataInit() {
  const fetchHook = useFetch()
  const setAuthUser = useAuthStore(state => state.setAuthUser)
  const [initContactStore, initChatListStore] = useStore(
    state => [state.initContactStore, state.initChatListStore],
    shallow,
  )

  async function initAppData() {
    const [authUserRes, contactsRes]: [AuthUserResType, ContactResType[]] = await Promise.all([
      fetchHook('users/me'),
      fetchHook('contacts'),
    ])

    setAuthUser(authUserRes)
    initContactStore(contactsRes)

    const initChatList: ChatListItemType[] = []
    const unarchivedRoomRes: UserToRoomResType[] = await fetchHook('user-to-room/rooms/unarchived')

    for (const unarchivedRoom of unarchivedRoomRes) {
      const chatListItem = {} as ChatListItemType

      chatListItem.userToRoomId = unarchivedRoom.userToRoomId
      chatListItem.room = {
        id: unarchivedRoom.room.id,
        archived: unarchivedRoom.archived,
        deleted: unarchivedRoom.deleted,
        isGroup: unarchivedRoom.room.isGroup,
        muted: unarchivedRoom.isMuted,
      }
      chatListItem.latestMsg = (await fetchHook(`rooms/${unarchivedRoom.room.id}/messages/latest`)) as MsgResType

      const usersInRoom = (await fetchHook(`rooms/${unarchivedRoom.room.id}/users`)) as UserType[]
      const receiverUser = usersInRoom.filter(user => user.id !== authUserRes.id)[0]

      chatListItem.user = receiverUser

      const queryString = new URLSearchParams({
        userId: receiverUser.id.toString(),
      })
      const contact: ContactResType | null = await fetchHook(`contacts?${queryString}`).catch(() => null)

      if (contact === null) {
        chatListItem.contact = null
      } else {
        chatListItem.contact = {
          id: contact.id,
          alias: contact.alias,
        }
      }

      initChatList.push(chatListItem)
    }
    initChatListStore(initChatList)
  }

  return { initAppData }
}

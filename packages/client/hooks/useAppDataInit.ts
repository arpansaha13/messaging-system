// Custom Hooks
import { useFetch } from './useFetch'
// Stores
import { useAuthStore } from '../stores/useAuthStore'
import { useContactStore } from '../stores/useContactStore'
import { useChatListStore } from '../stores/useChatListStore'
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
  const initContactStore = useContactStore(state => state.init)
  const initChatListStore = useChatListStore(state => state.init)

  async function initAppData() {
    const [authUserRes, contactsRes]: [AuthUserResType, ContactResType[]] = await Promise.all([
      fetchHook('users/me'),
      fetchHook('contacts'),
    ])

    setAuthUser(authUserRes)
    initContactStore(contactsRes)

    const initChatList: ChatListItemType[] = []
    const userToRoomRes: UserToRoomResType[] = await fetchHook('user-to-room')

    for (const userToRoom of userToRoomRes) {
      const chatListItem = {} as ChatListItemType

      chatListItem.userToRoomId = userToRoom.userToRoomId
      chatListItem.room = {
        id: userToRoom.room.id,
        archived: userToRoom.archived,
        deleted: userToRoom.deleted,
        isGroup: userToRoom.room.isGroup,
        muted: userToRoom.isMuted,
      }
      chatListItem.latestMsg = (await fetchHook(`rooms/${userToRoom.room.id}/messages/latest`)) as MsgResType

      const usersInRoom = (await fetchHook(`rooms/${userToRoom.room.id}/users`)) as UserType[]
      const receiverUser = usersInRoom.filter(user => user.id !== authUserRes.id)[0]

      chatListItem.user = receiverUser
      chatListItem.contact = {
        alias: ((await fetchHook(`contacts/${receiverUser.id}`)) as ContactResType).alias,
      }

      initChatList.push(chatListItem)
    }
    initChatListStore(initChatList)
  }

  return { initAppData }
}

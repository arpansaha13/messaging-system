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
  const [initContactStore, initUnarchivedStore, initArchivedStore] = useStore(
    state => [state.initContactStore, state.initUnarchivedStore, state.initArchivedStore],
    shallow,
  )

  async function initAppData() {
    const authUserRes: AuthUserResType = await fetchHook('users/me')
    setAuthUser(authUserRes)

    const unarchivedRoomRes: UserToRoomResType[] = await fetchHook('user-to-room/rooms/unarchived')
    const initChatList = await prepareChatList(unarchivedRoomRes, authUserRes.id, fetchHook)
    initUnarchivedStore(initChatList)

    /** Not awaiting for contacts */
    fetchHook('contacts').then((contactsRes: ContactResType[]) => initContactStore(contactsRes))

    /** Not awaiting for archived data */
    fetchHook('user-to-room/rooms/archived').then(async (archivedRoomRes: UserToRoomResType<true>[]) => {
      const initChatList = await prepareChatList<true>(archivedRoomRes, authUserRes.id, fetchHook)
      initArchivedStore(initChatList)
    })
  }

  return { initAppData }
}

/** Generic type A = archived */
async function prepareChatList<A = false>(
  roomRes: ReadonlyArray<UserToRoomResType<A>>,
  authUserId: number,
  fetchHook: ReturnType<typeof useFetch>,
): Promise<ChatListItemType<A>[]> {
  const chatList: ChatListItemType<A>[] = []

  for (const roomResItem of roomRes) {
    const chatListItem = {} as ChatListItemType<A>

    chatListItem.userToRoomId = roomResItem.userToRoomId
    chatListItem.room = {
      id: roomResItem.room.id,
      archived: roomResItem.archived,
      deleted: roomResItem.deleted,
      isGroup: roomResItem.room.isGroup,
      muted: roomResItem.isMuted,
    }
    chatListItem.latestMsg = (await fetchHook(`rooms/${roomResItem.room.id}/messages/latest`)) as MsgResType

    const usersInRoom = (await fetchHook(`rooms/${roomResItem.room.id}/users`)) as UserType[]
    const receiverUser = usersInRoom.filter(user => user.id !== authUserId)[0]

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
    chatList.push(chatListItem)
  }
  return chatList
}

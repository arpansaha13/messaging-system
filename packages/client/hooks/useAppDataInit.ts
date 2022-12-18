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

    const convoRes: any[] = await fetchHook('users/convo')
    const { unarchivedList, archivedList } = prepareChatList(convoRes)
    initUnarchivedStore(unarchivedList)
    initArchivedStore(archivedList)

    /** Not awaiting for contacts */
    fetchHook('contacts').then((contactsRes: ContactResType[]) => initContactStore(contactsRes))
  }

  return { initAppData }
}

/** Generic type A = archived */
function prepareChatList(convoRes: any[]): {
  unarchivedList: ChatListItemType[]
  archivedList: ChatListItemType<true>[]
} {
  const archivedList: ChatListItemType<true>[] = []
  const unarchivedList: ChatListItemType[] = []

  for (const convoItem of convoRes) {
    const template: ChatListItemType<boolean> = {
      userToRoomId: convoItem.u2r_id,
      room: {
        id: convoItem.r_id,
        archived: convoItem.u2r_archived,
        deleted: convoItem.u2r_deleted,
        muted: convoItem.u2r_muted,
        isGroup: convoItem.r_is_group,
      },
      contact: convoItem.c_id
        ? {
            id: convoItem.c_id,
            alias: convoItem.c_alias,
          }
        : null,
      user: {
        id: convoItem.u_id,
        dp: convoItem.u_dp,
        bio: convoItem.u_bio,
        displayName: convoItem.u_display_name,
      },
      latestMsg: convoItem.msg_content
        ? {
            content: convoItem.msg_content,
            createdAt: convoItem.msg_created_at,
            senderId: convoItem.msg_sender_id,
            status: convoItem.msg_status,
          }
        : null,
    }
    if (template.room.archived) archivedList.push(template as ChatListItemType<true>)
    else unarchivedList.push(template as ChatListItemType<false>)
  }
  return { unarchivedList, archivedList }
}

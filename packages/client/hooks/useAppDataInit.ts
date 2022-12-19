import shallow from 'zustand/shallow'
// Custom Hooks
import { useFetch } from './useFetch'
// Stores
import { useStore } from '../stores/index.store'
import { useAuthStore } from '../stores/useAuthStore'
// Types
import type { AuthUserResType, ContactResType, ConvoItemType } from '../types/index.types'

export function useAppDataInit() {
  const fetchHook = useFetch()
  const setAuthUser = useAuthStore(state => state.setAuthUser)
  const [initContactStore, initUnarchivedConvo, initArchivedConvo] = useStore(
    state => [state.initContactStore, state.initUnarchivedConvo, state.initArchivedConvo],
    shallow,
  )

  async function initAppData() {
    const authUserRes: AuthUserResType = await fetchHook('users/me')
    setAuthUser(authUserRes)

    const convoRes: any[] = await fetchHook('users/convo')
    const { unarchivedList, archivedList } = prepareConvo(convoRes)
    initUnarchivedConvo(unarchivedList)
    initArchivedConvo(archivedList)

    /** Not awaiting for contacts */
    fetchHook('contacts').then((contactsRes: ContactResType[]) => initContactStore(contactsRes))
  }

  return { initAppData }
}

/** Generic type A = archived */
function prepareConvo(convoRes: any[]): {
  unarchivedList: ConvoItemType[]
  archivedList: ConvoItemType<true>[]
} {
  const archivedList: ConvoItemType<true>[] = []
  const unarchivedList: ConvoItemType[] = []

  for (const convoItem of convoRes) {
    const template: ConvoItemType<boolean> = {
      userToRoomId: convoItem.u2r_id,
      room: {
        id: convoItem.r_id,
        archived: convoItem.u2r_archived,
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
    if (template.room.archived) archivedList.push(template as ConvoItemType<true>)
    else unarchivedList.push(template as ConvoItemType<false>)
  }
  return { unarchivedList, archivedList }
}

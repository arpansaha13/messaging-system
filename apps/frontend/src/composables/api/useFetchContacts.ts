import type { IContact } from '~/types'

interface ContactResponseItem {
  id: IContact['id']
  alias: IContact['alias']
  userInContact: {
    bio: IContact['bio']
    dp: IContact['dp']
    globalName: IContact['globalName']
    id: IContact['userId']
    username: IContact['username']
  }
}

export function useFetchContacts() {
  return useAsyncData(
    asyncKeys.contacts,
    async () => {
      const { $api } = useNuxtApp()
      const res = await $api<ContactResponseItem[]>('/api/contacts')
      return res.map(
        item =>
          ({
            id: item.id,
            alias: item.alias,
            dp: item.userInContact.dp,
            bio: item.userInContact.bio,
            userId: item.userInContact.id,
            username: item.userInContact.username,
            globalName: item.userInContact.globalName,
          }) as IContact,
      )
    },
    {
      transform: res => {
        return Object.groupBy(res, item => item.alias[0]!.toUpperCase())
      },
    },
  )
}

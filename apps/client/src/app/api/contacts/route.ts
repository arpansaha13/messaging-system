import _response from '~/utils/api/_response'
import rfetch from '../utils/rfetch'
import type { IContactResponseFromBE } from '@shared/types'
import type { IContact } from '@shared/types/client'

export async function GET(request: Request) {
  const res = await rfetch(request)
  const body: IContactResponseFromBE[] = await res.json()
  const hasSearchParams = new URL(request.url).searchParams.size > 0

  if (hasSearchParams) {
    return _response(
      res,
      body.map<IContact>(contact => ({
        alias: contact.alias,
        id: contact.id,
        userId: contact.userInContact.id,
        bio: contact.userInContact.bio,
        dp: contact.userInContact.dp,
        username: contact.userInContact.username,
        globalName: contact.userInContact.globalName,
      })),
    )
  }

  const newContacts: Record<string, IContact[]> = {}

  for (const contactResItem of body) {
    const letter = contactResItem.alias[0] as string
    if (typeof newContacts[letter] === 'undefined') newContacts[letter] = []

    newContacts[letter].push({
      alias: contactResItem.alias,
      id: contactResItem.id,
      userId: contactResItem.userInContact.id,
      bio: contactResItem.userInContact.bio,
      dp: contactResItem.userInContact.dp,
      username: contactResItem.userInContact.username,
      globalName: contactResItem.userInContact.globalName,
    })
  }

  return _response(res, newContacts)
}

export async function POST(request: Request) {
  const res = await rfetch(request)
  const body = await res.json()

  const newBody: IContact = {
    id: body.id,
    alias: body.alias,
    userId: body.userInContact.id,
    dp: body.userInContact.dp,
    bio: body.userInContact.bio,
    username: body.userInContact.username,
    globalName: body.userInContact.globalName,
  }

  return _response(res, newBody)
}

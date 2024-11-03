import _response from '~/utils/api/_response'
import { overwriteBaseUrl } from '~/utils/api/overwriteBaseUrl'
import { formatChatListItemResponse } from './format'
import type { IChatsResponse, IChatsResponseFromBE } from '@shared/types'

export async function GET(request: Request) {
  const res = await fetch(overwriteBaseUrl(request))
  const { archived, unarchived }: IChatsResponseFromBE = await res.json()

  const formattedArchived = archived.map(a => formatChatListItemResponse(a))
  const formattedUnarchived = unarchived.map(u => formatChatListItemResponse(u))

  const newBody: IChatsResponse = { archived: formattedArchived, unarchived: formattedUnarchived }

  return _response(res, newBody)
}

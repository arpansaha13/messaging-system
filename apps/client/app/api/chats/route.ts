import _response from '~api/utils/_response'
import rfetch from '../utils/rfetch'
import { formatChatListItemResponse } from './format'

export async function GET(request: Request) {
  const res = await rfetch(request)
  const { archived, unarchived } = await res.json()

  const formattedArchived = archived.map((a: any) => formatChatListItemResponse(a))
  const formattedUnarchived = unarchived.map((u: any) => formatChatListItemResponse(u))

  return _response(res, { archived: formattedArchived, unarchived: formattedUnarchived })
}

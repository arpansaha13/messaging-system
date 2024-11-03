import _response from '~/utils/api/_response'
import rfetch from '~api/utils/rfetch'
import { formatChatListItemResponse } from '../format'

export async function GET(request: Request) {
  const res = await rfetch(request)
  const body = await res.json()
  const formattedBody = formatChatListItemResponse(body)
  return _response(res, formattedBody)
}

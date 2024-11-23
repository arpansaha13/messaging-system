import _response from '~/utils/api/_response'
import { overwriteBaseUrl } from '~/utils/api/overwriteBaseUrl'
import { formatChatListItemResponse } from '../format'

export async function GET(request: Request) {
  const res = await fetch(overwriteBaseUrl(request))
  const body = await res.json()
  const formattedBody = formatChatListItemResponse(body)
  return _response(res, formattedBody)
}

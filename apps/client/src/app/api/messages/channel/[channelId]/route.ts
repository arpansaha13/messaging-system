import { MessageStatus } from '@shared/constants'
import _response from '~/utils/api/_response'
import { overwriteBaseUrl } from '~/utils/api/overwriteBaseUrl'
import type { IGroupMessage } from '@shared/types'

export async function GET(request: Request) {
  const res = await fetch(overwriteBaseUrl(request))
  const messages: IGroupMessage[] = await res.json()

  // Hardcoded message status for now
  const newBody = structuredClone(messages)
  newBody.forEach(message => {
    message.status = MessageStatus.SENT
  })

  return _response(res, newBody)
}

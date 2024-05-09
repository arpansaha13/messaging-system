import createRequest from './createRequest'
import type { RequestOptions } from '@pkg/types'

export default async function _fetch(url: string, options?: RequestOptions) {
  const request = createRequest(url, options)
  const res = await fetch(request)

  const textData = await res.text()
  let jsonData: any = null

  if (textData) {
    try {
      jsonData = JSON.parse(textData)
    } catch {
      jsonData = { message: textData }
    }
  }

  if (res.status >= 400) throw jsonData
  return jsonData
}

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

export function createRequest(url: string, options?: RequestOptions) {
  const headers = {
    ...(options?.headers ?? {}),
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  const body = options?.body ? new URLSearchParams(options?.body).toString() : null

  if (url.startsWith('/')) {
    url = '/api' + url
  } else {
    url = '/api/' + url
  }

  return new Request(url, {
    ...options,
    body,
    headers,
    credentials: 'include',
  })
}

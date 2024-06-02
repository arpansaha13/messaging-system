import type { RequestOptions } from '@pkg/types'

export default async function _fetch(url: string, options?: RequestOptions) {
  const request = createRequest(url, options)
  const res = await fetch(request)

  if (res.status === 204 || res.body === null) return null

  let jsonData: any = null

  try {
    jsonData = await res.json()
  } catch {
    return jsonData
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

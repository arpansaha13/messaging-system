import type { RequestOptions } from '@pkg/types'

export default function createRequest(url: string, options?: RequestOptions) {
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

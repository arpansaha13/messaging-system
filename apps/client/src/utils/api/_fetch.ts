import type { RequestOptions } from '@shared/types'

/**
 * For use in client components.
 */
export default async function _fetch(url: string, options?: RequestOptions) {
  const request = createRequest(url, options)
  const res = await fetch(request)

  if (res.status >= 500) throw new Error('Something went wrong!', { cause: 'Server Error' })
  if (res.status === 204 || res.body === null) return null

  let data: any = await res.text()

  try {
    data = JSON.parse(data)
  } catch {
    if (res.status < 400) return data // text data
  }

  if (res.status >= 400) throw data
  return data
}

function createRequest(url: string, options?: RequestOptions) {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  const body = options?.body ? new URLSearchParams(options.body).toString() : null

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

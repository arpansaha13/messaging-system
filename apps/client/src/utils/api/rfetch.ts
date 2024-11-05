import { cookies } from 'next/headers'
import type { RequestOptions } from '@shared/types'

export type FetchResult<T> = { data: T; error: null } | { data: null; error: Exception }

export interface Exception {
  data?: any
  status: number
  message: string
}

/**
 * For use in server components and server actions.
 */
export default async function rfetch<T = null>(url: string, options?: RequestOptions): Promise<FetchResult<T>> {
  const request = createRequest(url, options)
  const res = await fetch(request)

  if (res.status >= 500) {
    return {
      data: null,
      error: { message: 'Something went wrong!', status: res.status },
    }
  }

  if (res.status === 204 || res.body === null) {
    return { data: null as T, error: null }
  }

  // Note: Do not send raw string data from server
  const data = await res.json()

  if (res.status >= 400) {
    return {
      data: null,
      error: { ...data, status: res.status },
    }
  }

  return { data, error: null }
}

function createRequest(url: string, options?: RequestOptions) {
  const cookieStore = cookies()

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': cookieStore.toString(),
  }

  const body = options?.body ? new URLSearchParams(options.body).toString() : null
  const urlWithBase = new URL(url, process.env.API_BASE_URL!)

  return new Request(urlWithBase, {
    ...options,
    body,
    headers,
  })
}

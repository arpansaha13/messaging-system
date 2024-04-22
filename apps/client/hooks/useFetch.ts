import type { RequestOptions } from '~/types'

/**
 * Returns a wrapper over the Fetch API.
 */
export function useFetch() {
  const fecthHook = (url: string, options?: RequestOptions) => {
    return fetch(process.env.NEXT_PUBLIC_API_BASE_URL! + url, {
      ...options,
      body: options?.body ? new URLSearchParams(options?.body) : null,
      credentials: 'include',
      headers: {
        ...(options?.headers ?? {}),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then(async res => {
      // Handle empty responses
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
    })
  }
  return fecthHook
}

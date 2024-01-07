import { useAuthStore } from '~/stores/useAuthStore'

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  /** @default 'GET' */
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'

  body?: Record<string, any>
}

const FETCH_BASE_URL =
  process.env.NODE_ENV === 'development' ? 'http://localhost:4000/' : process.env.NEXT_PUBLIC_BASE_URL!

/**
 * Returns a wrapper over the Fetch API.
 *
 * 1) Adds the auth token (if any), from the store, into the request headers.
 *
 * 2) Adds the `Content-type` header as `application/x-www-form-urlencoded`.
 *
 * 3) Converts the JSON body to url-encoded form.
 *
 * 4) Extracts and returns the json response so that the json data is directly available in the then() block.
 *
 * Note:
 *
 * 2) This hook does not check if auth token is expired or not.
 */
export function useFetch() {
  const authToken = useAuthStore(state => state.authToken)

  const fecthHook = (url: string, options?: RequestOptions) => {
    return fetch(`${FETCH_BASE_URL}${url}`, {
      ...options,
      body: options?.body ? new URLSearchParams(options?.body) : null,
      headers: {
        ...(options?.headers ?? {}),
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(authToken !== null ? { Authorization: `Bearer ${authToken}` } : {}),
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

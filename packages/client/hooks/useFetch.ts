import { useAuthStore } from '../stores/useAuthStore'

const FETCH_BASE_URL = 'http://localhost:4000/'

/**
 * Returns a wrapper over the Fetch API.
 *
 * 1) Adds the auth token (if any), from the store, into the request headers.
 *
 * 2) Adds the `Content-type` header as `application/x-www-form-urlencoded`.
 *
 * 3) Converts the JSON-stringified body-data to url-encoded form.
 *
 * 4) Extracts and returns the json response so that the json data is directly available in the then() block.
 *
 * Note:
 *
 * 1) Body data (if provided) must be a stringified JSON.
 *
 * 2) This hook does not check if auth token is expired or not.
 */
export function useFetch() {
  const authToken = useAuthStore(state => state.authToken)

  const fecthHook = (url: string, options?: RequestInit) => {
    return fetch(`${FETCH_BASE_URL}${url}`, {
      ...options,
      body: options?.body ? new URLSearchParams(JSON.parse(options?.body as string)) : null,
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

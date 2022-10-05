import Router from 'next/router'
import { useAuthStore } from '../stores/useAuthStore'

/**
 * Returns a wrapper over the Fetch API.
 *
 * 1) Adds the auth token (if any), from the store, into the request headers.
 *
 * 2) Redirects to sign-in page if auth token expires. Time for expiry is received along with auth token during sign-in or sign-up.
 *
 * 3) Adds the `Content-type` header as `application/x-www-form-urlencoded`.
 *
 * 4) Extracts and returns the json response so that the json data is directly available in the then() block.
 *
 * Note: Body data (if provided) must be a stringified JSON.
 */
export function useFetch() {
  const authToken = useAuthStore(state => state.authToken)
  const expiresAt = useAuthStore(state => state.expiresAt)

  return (input: RequestInfo | URL, options?: RequestInit) => {
    if (expiresAt !== null && Date.now() >= expiresAt) {
      Router.push('/')
    }
    return (
      fetch(input, {
        ...options,
        body: options?.body ? new URLSearchParams(JSON.parse(options?.body as string)) : null,
        headers: {
          ...(options?.headers ?? {}),
          'Content-Type': 'application/x-www-form-urlencoded',
          ...(authToken !== null ? {Authorization: `Bearer ${ authToken }`} : {}),
        }
      })
      .then(async (res) => {
        const data = await res.json()
        if (res.status >= 400) {
          throw data;
        }
        return data
      })
    )
  }
}

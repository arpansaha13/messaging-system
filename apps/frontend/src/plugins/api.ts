import { isNullOrUndefined } from '@arpansaha13/utils'

export default defineNuxtPlugin(nuxtApp => {
  const logger = useLogger('api')
  const api = $fetch.create({
    onRequest({ options }) {
      const runtimeConfig = useRuntimeConfig()

      if (import.meta.client) {
        options.credentials = 'include'
      } else {
        // Environment variables are validated at startup, so these are guaranteed to exist
        options.baseURL = runtimeConfig.apiBaseUrl
        const authCookieName = runtimeConfig.authCookieName

        const headers = new Headers(options.headers)
        const token = useCookie<string | null>(authCookieName)
        if (token.value) {
          headers.set('Cookie', `${authCookieName}=${token.value}`)
        }
        options.headers = headers

        if (options.body) {
          const filteredBody = new URLSearchParams()

          Object.entries(options.body as Record<string, any>).forEach(([key, value]) => {
            if (isNullOrUndefined(value)) return
            filteredBody.append(key, String(value))
          })

          options.body = filteredBody
        }
      }
    },
    async onResponseError({ response }) {
      logger.debug(`API Request failed: [${response.status}] ${response.url}`, response._data)

      try {
        response._data = JSON.parse(response._data)
      } catch {
        // Not a JSON response
      }

      /**
       * `/api/auth/verify/:hash` returns 401 for invalid or expired OTPs.
       * Skip redirection to login page when on verification page.
       */
      const isAuthVerification = response.url?.includes('/api/auth/verify/')

      if (response.status === 401 && !isAuthVerification) {
        await nuxtApp.runWithContext(() => navigateTo('/auth/login'))
      }
    },
  })

  return {
    provide: {
      api,
    },
  }
})

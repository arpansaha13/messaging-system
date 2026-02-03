import { isNullOrUndefined } from '@arpansaha13/utils'

export default defineNuxtPlugin(nuxtApp => {
  const api = $fetch.create({
    onRequest({ options }) {
      const runtimeConfig = useRuntimeConfig()

      if (import.meta.client) {
        options.credentials = 'include'
      } else {
        const authCookieName = runtimeConfig.authCookieName
        if (!authCookieName) return

        const baseURL = runtimeConfig.apiBaseUrl
        if (baseURL) {
          options.baseURL = baseURL
        }

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
      try {
        response._data = JSON.parse(response._data)
      } catch {
        // Not a JSON response
      }

      if (response.status === 401) {
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

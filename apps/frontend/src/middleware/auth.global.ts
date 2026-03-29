export default defineNuxtRouteMiddleware(async to => {
  if (to.path.startsWith('/auth') || to.path.startsWith('/invites')) {
    return
  }

  if (import.meta.client) return

  const runtimeConfig = useRuntimeConfig()
  const cookieName = runtimeConfig.authCookieName || 'session'
  const sessionCookie = useCookie<string | null>(cookieName)

  if (!sessionCookie.value) {
    return navigateTo('/auth/login')
  }

  try {
    const baseURL = runtimeConfig.apiBaseUrl
    await $fetch('/api/users/me', {
      baseURL,
      headers: {
        cookie: `${cookieName}=${sessionCookie.value}`,
      },
    })
  } catch {
    return navigateTo('/auth/login')
  }
})

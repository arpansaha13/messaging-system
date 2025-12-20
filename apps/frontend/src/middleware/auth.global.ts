export default defineNuxtRouteMiddleware(async to => {
  const runtimeConfig = useRuntimeConfig()

  const isAuthRoute = to.path.startsWith('/auth')
  const isProtectedRoute = !isAuthRoute

  if (import.meta.server) {
    const authCookieName = runtimeConfig.authCookieName
    if (!authCookieName) return

    const { $api } = useNuxtApp()

    try {
      const { valid } = await $api<{ valid: boolean }>('/api/auth/check-auth')

      if (valid && isAuthRoute) {
        return navigateTo('/')
      }

      if (!valid && isProtectedRoute) {
        return navigateTo('/auth/login')
      }
    } catch {
      if (isProtectedRoute) {
        return navigateTo('/auth/login')
      }
    }
  }
})

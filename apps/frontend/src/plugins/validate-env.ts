/**
 * Environment configuration validation plugin
 *
 * Validates that all required environment variables are set at application startup.
 * Throws an error immediately if any required variable is missing, preventing
 * the application from initializing with incomplete configuration.
 *
 * This ensures that configuration errors are caught early rather than causing
 * runtime failures later.
 */
export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()

  // Define required environment variables
  const requiredEnvVars = [{ key: 'authCookieName', displayName: 'AUTH_COOKIE_NAME' }] as const

  const requiredPublicEnvVars = [
    // { key: 'csrfCookieName', displayName: 'CSRF_COOKIE_NAME' },
  ] as const

  const missingPrivateVars: string[] = []
  if (import.meta.server) {
    // Validate private environment variables
    for (const { key, displayName } of requiredEnvVars) {
      const value = runtimeConfig[key as keyof typeof runtimeConfig]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingPrivateVars.push(displayName)
      }
    }
  }

  // Validate public environment variables
  const missingPublicVars: string[] = []
  for (const { key, displayName } of requiredPublicEnvVars) {
    const value = runtimeConfig.public[key as keyof typeof runtimeConfig.public]
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingPublicVars.push(displayName)
    }
  }

  // Throw error if any required variables are missing
  const allMissingVars = [...missingPrivateVars, ...missingPublicVars]
  if (allMissingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${allMissingVars.join(', ')}`
    throw new Error(errorMessage)
  }
})

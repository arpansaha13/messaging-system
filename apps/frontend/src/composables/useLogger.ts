/**
 * useLogger - Structured logging composable
 *
 * Provides a consistent logging interface across the application,
 * with context labels and environment-aware log levels.
 *
 * @param contextLabel - Label to identify the source of the log (e.g., 'PersonalChat', 'useSocket')
 * @returns Logger object with debug, info, warn, and error methods
 *
 * @example
 * const logger = useLogger('MyComponent')
 * logger.error('Failed to fetch data', error)
 */
export function useLogger(contextLabel: string) {
  const isDev = process.env.NODE_ENV === 'development'

  return {
    debug: (message: string, data?: unknown) => {
      if (isDev) {
        console.debug(`[${contextLabel}] ${message}`, data)
      }
    },

    info: (message: string, data?: unknown) => {
      console.info(`[${contextLabel}] ${message}`, data)
    },

    warn: (message: string, data?: unknown) => {
      console.warn(`[${contextLabel}] ${message}`, data)
    },

    error: (message: string, error?: Error | unknown) => {
      console.error(`[${contextLabel}] ${message}`, error)
      // TODO: In production, send to error tracking service
    },
  }
}

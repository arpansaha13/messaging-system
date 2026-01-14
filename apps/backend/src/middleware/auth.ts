import type { RequestHandler } from 'express'
import { AuthService } from '../services/auth'

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = ['/api/auth/signup', '/api/auth/verify-otp', '/api/auth/login', '/api/health', '/api/status']

/**
 * Check if the request URL is a public endpoint
 */
function isPublicEndpoint(url: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => url.startsWith(endpoint))
}

export const createAuthMiddleware = (): RequestHandler => {
  return async (req, res, next) => {
    // Skip authentication for public endpoints
    if (isPublicEndpoint(req.url)) {
      return next()
    }

    const sessionKey = req.cookies?.[AUTH_COOKIE_NAME]
    if (!sessionKey) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const result = await AuthService.validateSession(sessionKey)

      if (!result.valid) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Map UserProfile to AuthUser (rename user_id to id for compatibility)
      req.context = {
        user: {
          id: result.user_id,
        },
        token: sessionKey,
      }

      return next()
    } catch (err) {
      console.error('auth middleware error', err)
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }
}

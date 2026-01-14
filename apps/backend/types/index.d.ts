import 'express'

// User object interface for request
interface AuthUser {
  id: number
  email?: string
  username?: string
  global_name?: string
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      context: {
        user?: AuthUser
        token?: string
      }
    }
  }
}

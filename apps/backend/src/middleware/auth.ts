import jwt from 'jsonwebtoken'
import type { RequestHandler } from 'express'
import { SessionRepository } from '../repositories/session'
import { UserRepository } from '../repositories/user'

const JWT_SECRET = process.env.JWT_SECRET
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME

export const createAuthMiddleware = (sessionRepo: SessionRepository, userRepo: UserRepository): RequestHandler => {
  return async (req, res, next) => {
    if (req.path.startsWith('/api/auth/')) {
      return next() // Skip middleware for auth routes
    }

    const unauthorized = () => res.status(401).json({ message: 'Unauthorized' })

    const sessionKey = req.cookies?.[AUTH_COOKIE_NAME]
    if (!sessionKey) return unauthorized()

    const session = await sessionRepo.findByKey(sessionKey)
    if (!session) return unauthorized()

    try {
      const payload: any = jwt.verify(session.token, JWT_SECRET)
      const user_id = payload.user_id
      if (!user_id) return unauthorized()
      const user = await userRepo.findById(user_id)
      if (!user) return unauthorized()
      req.user = user
    } catch (err) {
      console.error('auth middleware error', err)
    }

    return next()
  }
}

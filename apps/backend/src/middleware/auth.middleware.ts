import jwt from 'jsonwebtoken'
import type { RequestHandler } from 'express'
import { SessionRepository } from '../repositories/session.repository'
import { UserRepository } from '../repositories/user.repository'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'msess'

export const createAuthMiddleware = (sessionRepo: SessionRepository, userRepo: UserRepository): RequestHandler => {
  return async (req, _res, next) => {
    const sessionKey = req.cookies?.[AUTH_COOKIE_NAME]
    if (!sessionKey) return next()

    const session = await sessionRepo.findByKey(sessionKey)
    if (!session) return next()

    try {
      const payload: any = jwt.verify(session.token, JWT_SECRET)
      const user_id = payload.user_id
      if (!user_id) return next()
      const user = await userRepo.findById(user_id)
      if (!user) return next()
      req.user = user
    } catch (err) {
      console.error('auth middleware error', err)
    }

    return next()
  }
}

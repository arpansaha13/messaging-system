import 'express'
import type { User } from '../src/models/user'

declare global {
  namespace Express {
    interface Request {
      user?: Pick<User, 'id' | 'bio' | 'dp' | 'email' | 'globalName' | 'username'>
    }
  }
}

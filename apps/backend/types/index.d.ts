import 'express'

declare global {
  namespace Express {
    // interface Request {
    //   user?: {
    //     id: number
    //   }
    // }

    interface User {
      id: number
    }
  }
}

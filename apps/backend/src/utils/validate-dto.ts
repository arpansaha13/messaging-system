import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import type { RequestHandler } from 'express'

type Source = 'body' | 'params' | 'query'

export function validateDto<T extends object>(cls: new () => T, source: Source = 'body'): RequestHandler {
  return async (req, res, next) => {
    const data = req[source]
    const instance = plainToInstance(cls, data)
    const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true })

    if (errors.length > 0) {
      const message = errors
        .flatMap(err => Object.values(err.constraints ?? {}))
        .filter(Boolean)
        .join(', ')
      return res.status(400).json({ message: message || 'Invalid request payload' })
    }

    req[source] = instance
    return next()
  }
}

import { createParamDecorator } from '@nestjs/common'
import { User } from 'src/users/user.entity'
import type { ExecutionContext } from '@nestjs/common'

export const GetPayload = createParamDecorator(
  /**
   * @param reqProperty property to extract from the `Request` object
   * @param ctx
   */
  (reqProperty: string, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest()
    return req[reqProperty]
  },
)

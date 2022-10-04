import { createParamDecorator } from '@nestjs/common'
// Entity
import { UserEntity } from 'src/entities/user.entity'
// Types
import type { ExecutionContext } from '@nestjs/common'

export const GetPayload = createParamDecorator(
  /**
   * @param reqProperty property to extract from the `Request` object
   * @param ctx
   */
  (reqProperty: string, ctx: ExecutionContext): UserEntity => {
    const req = ctx.switchToHttp().getRequest()
    return req[reqProperty]
  },
)

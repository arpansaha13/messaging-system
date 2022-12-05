import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// Types
import type { UserEntity } from 'src/users/user.entity'

@Controller('users')
@UseGuards(AuthGuard())
export class UserController {
  @Get('me')
  async getAuthUserInfo(@GetPayload('user') authUser: UserEntity): Promise<UserEntity> {
    return authUser
  }
}

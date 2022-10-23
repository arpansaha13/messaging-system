import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// Types
import type { UserEntity } from 'src/users/user.entity'

@Controller('me')
@UseGuards(AuthGuard())
export class AuthUserController {
  @Get()
  async getAuthUserInfo(
    @GetPayload('user') userEntity: UserEntity,
  ): Promise<UserEntity> {
    return userEntity
  }
}

import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// Service
import { UserService } from './user.service'
// DTO
import { UserIdParam } from './dto/user-id-param.dto'
import { UpdateUserInfoDto } from './dto/update-user-info.dto'
// Types
import type { UserEntity } from 'src/users/user.entity'

@Controller('users')
@UseGuards(AuthGuard())
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  async getAuthUserInfo(@GetPayload('user') authUser: UserEntity): Promise<UserEntity> {
    return authUser
  }

  @Get('/:userId')
  getUserById(@Param() params: UserIdParam): Promise<UserEntity> {
    return this.userService.getUserById(params.userId)
  }

  @Get('/:userId/room-ids')
  getRoomIdsOfUser(@Param() params: UserIdParam): Promise<UserEntity> {
    return this.userService.getRoomIdsOfUser(params.userId)
  }

  @Patch('/:userId')
  updateUserInfo(@GetPayload('user') authUser: UserEntity, @Body() data: UpdateUserInfoDto) {
    return this.userService.updateUserInfo(authUser.id, data)
  }
}

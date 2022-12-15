import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// Service
import { UserService } from './user.service'
// DTO
import { GetUserByIdParamsDto } from './dto/GetUserByIdParams.dto'
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
  async getUserById(@Param() params: GetUserByIdParamsDto): Promise<UserEntity> {
    return this.userService.getUserById(params.userId)
  }

  @Get('/:userId/room-ids')
  async getRoomIdsOfUser(@Param() params: GetUserByIdParamsDto): Promise<UserEntity> {
    return this.userService.getRoomIdsOfUser(params.userId)
  }
}

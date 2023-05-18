import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// Services
import { UserService } from './user.service'
// DTO
import { UserIdParam } from './dto/user-id-param.dto'
import { UserSearchQuery } from './dto/user-search-query.dto'
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

  @Get('/convo')
  getUserConvo(@GetPayload('user') authUser: UserEntity): Promise<any> {
    return this.userService.getUserConvo(authUser.id)
  }

  @Get('/search')
  findUsers(@GetPayload('user') authUser: UserEntity, @Query() query: UserSearchQuery): Promise<UserEntity> {
    return this.userService.findUsers(authUser.id, query.search)
  }

  @Get('/:userId')
  getUserById(@Param() params: UserIdParam): Promise<UserEntity> {
    return this.userService.getUserById(params.userId)
  }

  @Get('/:userId/room-ids')
  getRoomIdsOfUser(@Param() params: UserIdParam): Promise<UserEntity['rooms']> {
    return this.userService.getRoomIdsOfUser(params.userId)
  }

  @Patch('/:userId')
  updateUserInfo(@GetPayload('user') authUser: UserEntity, @Body() data: UpdateUserInfoDto) {
    return this.userService.updateUserInfo(authUser.id, data)
  }
}

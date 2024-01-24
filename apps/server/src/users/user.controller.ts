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
import type { User } from 'src/users/user.entity'

@Controller('users')
@UseGuards(AuthGuard())
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  async getAuthUserInfo(@GetPayload('user') authUser: User): Promise<User> {
    return authUser
  }

  @Get('/convo')
  getUserConvo(@GetPayload('user') authUser: User): Promise<any> {
    return this.userService.getUserConvo(authUser.id)
  }

  @Get('/search')
  findUsers(@GetPayload('user') authUser: User, @Query() query: UserSearchQuery): Promise<User> {
    return this.userService.findUsers(authUser.id, query.search)
  }

  @Get('/:userId')
  getUserById(@Param() params: UserIdParam): Promise<User> {
    return this.userService.getUserById(params.userId)
  }

  @Get('/:userId/room-ids')
  getRoomIdsOfUser(@Param() params: UserIdParam): Promise<User['rooms']> {
    return this.userService.getRoomIdsOfUser(params.userId)
  }

  @Patch('/:userId')
  updateUserInfo(@GetPayload('user') authUser: User, @Body() data: UpdateUserInfoDto) {
    return this.userService.updateUserInfo(authUser.id, data)
  }
}

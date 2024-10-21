import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { UserService } from './user.service'
import { UserIdParam } from './dto/user-id-param.dto'
import { UserSearchQuery } from './dto/user-search-query.dto'
import { UpdateUserInfoDto } from './dto/update-user-info.dto'
import type { Request } from 'express'
import type { User } from 'src/users/user.entity'
import type { GetUserWithContactResponse } from './dto/get-user-with-contact.response'

@Controller('users')
@UseGuards(AuthGuard())
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  async getAuthUserInfo(@Req() request: Request): Promise<User> {
    return request.user
  }

  @Patch('/me')
  updateAuthUserInfo(@Req() request: Request, @Body() data: UpdateUserInfoDto): Promise<User> {
    return this.userService.updateUserInfo(request.user.id, data)
  }

  @Get('/search')
  findUsers(@Req() request: Request, @Query() query: UserSearchQuery): Promise<User[]> {
    return this.userService.findUsers(request.user.id, query)
  }

  @Get('/:userId')
  getUserWithContactById(@Req() request: Request, @Param() params: UserIdParam): Promise<GetUserWithContactResponse> {
    return this.userService.getUserWithContactById(request.user.id, params.userId)
  }
}

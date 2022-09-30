import { Controller, Get } from '@nestjs/common'
import { UsersService } from 'src/services/users.service'
// Types
import { UserDataType } from 'src/types'

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/users')
  getChatList(): UserDataType[] {
    return this.usersService.getUsers()
  }
}

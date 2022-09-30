import { Controller, Get } from '@nestjs/common'
import { UsersService } from 'src/services/users.service'
// Models
import type { UserDataModel } from 'src/models/user.model'

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/users')
  getChatList(): UserDataModel[] {
    return this.usersService.getUsers()
  }
}

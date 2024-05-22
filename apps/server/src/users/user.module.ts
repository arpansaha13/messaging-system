import { Module } from '@nestjs/common'
import { MessageModule } from 'src/messages/message.module'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { UserRepository } from './user.repository'

@Module({
  imports: [MessageModule],
  controllers: [UserController],
  providers: [UserRepository, UserService],
})
export class UserModule {}

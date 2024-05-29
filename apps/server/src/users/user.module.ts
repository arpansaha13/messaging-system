import { Module } from '@nestjs/common'
import { MessageModule } from 'src/messages/message.module'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { UserRepository } from './user.repository'
import { ContactRepository } from 'src/contacts/contact.repository'

@Module({
  imports: [MessageModule],
  controllers: [UserController],
  providers: [ContactRepository, UserRepository, UserService],
})
export class UserModule {}

import { Module } from '@nestjs/common'
import { MessageModule } from 'src/messages/message.module'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { UserRepository } from './user.repository'
import { ContactModule } from 'src/contacts/contact.module'

@Module({
  imports: [ContactModule, MessageModule],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [UserRepository],
})
export class UserModule {}

import { Module } from '@nestjs/common'
import { MessageModule } from 'src/messages/message.module'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { UserRepository } from './user.repository'
import { ContactModule } from 'src/contacts/contact.module'
import { ChannelModule } from 'src/channels/channel.module'
import { UserGroupModule } from 'src/user_group/user_group.module'

@Module({
  imports: [ContactModule, ChannelModule, MessageModule, UserGroupModule],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [UserRepository],
})
export class UserModule {}
